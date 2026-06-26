import { Express } from "express";
import { storage } from "../storage";
import { LIBRETRO_PLAYLISTS } from "./shared";
import { dataPath } from "../data-dir";
import path from "node:path";
import fs from "node:fs/promises";

const STOP_WORDS = new Set(["the","a","an","and","of","in","to","for","with","by","at","from","is","it","on","or","as","be","but","not","so"]);

const LISTING_CACHE_TTL = 24 * 60 * 60 * 1000;

type CachedListing = { entries: string[]; fetchedAt: number };
const listingCache = new Map<string, CachedListing>();

async function fetchDirectoryListing(playlist: string): Promise<string[]> {
  const cached = listingCache.get(playlist);
  if (cached && Date.now() - cached.fetchedAt < LISTING_CACHE_TTL) {
    return cached.entries;
  }

  const url = `https://thumbnails.libretro.com/${encodeURIComponent(playlist)}/Named_Boxarts/`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CabinetBridge/0.1" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Libretro listing returned ${res.status}`);

  const html = await res.text();

  const entries: string[] = [];
  const regex = /<a\s+href="([^"]+\.png)">/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const decoded = decodeURIComponent(match[1]);
    entries.push(decoded);
  }

  listingCache.set(playlist, { entries, fetchedAt: Date.now() });
  return entries;
}

function stripTags(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .trim();
}

function normalizeForCompare(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/_/g, " ")
    .replace(/[^a-z0-9'!\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRegions(name: string): string[] {
  const regions: string[] = [];
  const parens = name.match(/\(([^)]+)\)/g);
  if (parens) {
    for (const p of parens) {
      for (const part of p.slice(1, -1).split(",")) {
        const t = part.trim().toLowerCase();
        if (t.length >= 2 && !["en","fr","de","es","it","pt","nl","sv","no","da","fi","pl","ru","zh","ko","ja","sgb","gb","rev","v"].includes(t)) {
          regions.push(t);
        }
      }
    }
  }
  return [...new Set(regions)];
}

function scoreMatch(romBase: string, entryBase: string): { score: number; method: string } {
  const r = normalizeForCompare(romBase);
  const e = normalizeForCompare(entryBase);

  if (r === e) return { score: 100, method: "exact" };

  const containsDir = r.includes(e) ? "re" : e.includes(r) ? "er" : null;
  if (containsDir) {
    const short = containsDir === "re" ? e : r;
    const long = containsDir === "re" ? r : e;
    const ratio = short.length / long.length;
    if (ratio < 0.45) return { score: Math.round(ratio * 100), method: "contains-fuzzy" };
    return { score: 80 + Math.round(ratio * 20), method: "contains" };
  }

  const rt = r.split(/\s+/).filter(Boolean);
  const et = e.split(/\s+/).filter(Boolean);
  const rs = rt.filter(t => t.length > 1 && !STOP_WORDS.has(t));
  const es = et.filter(t => t.length > 1 && !STOP_WORDS.has(t));
  if (rs.length === 0 || es.length === 0) return { score: 0, method: "none" };

  const overlap = rs.filter(t => es.includes(t));
  if (overlap.length === 0) return { score: 0, method: "none" };

  const base = Math.round((overlap.length / rs.length + overlap.length / es.length) * 50);
  const ru = rs.filter(t => !overlap.includes(t));
  const eu = es.filter(t => !overlap.includes(t));

  let s = base;
  if (ru.length > 0 && eu.length > 0) s = Math.round(s * 0.6);
  else if (ru.length > 0 && ru.length >= rs.length * 0.5) s = Math.round(s * 0.6);
  else if (eu.length > 0 && eu.length >= es.length * 0.5) s = Math.round(s * 0.6);

  if (s < 50) return { score: 0, method: "token-penalty" };
  return { score: s, method: "tokens" };
}

export async function findLibretroBoxArt(system: string, title: string): Promise<{ url: string | null; message: string }> {
  const playlist = LIBRETRO_PLAYLISTS[system];
  if (!playlist) return { url: null, message: "No Libretro thumbnail playlist configured." };

  let entries: string[];
  try {
    entries = await fetchDirectoryListing(playlist);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch Libretro listing";
    return { url: null, message: msg };
  }

  if (entries.length === 0) return { url: null, message: `No box art found in Libretro for "${playlist}".` };

  const romClean = title.replace(/\.[^.]+$/, "");
  const romBase = stripTags(romClean);
  const romRegions = extractRegions(romClean);

  let best = { score: 0, entry: "", method: "" };

  for (const entry of entries) {
    const entryClean = entry.replace(/\.png$/i, "");
    const eBase = stripTags(entryClean);
    const result = scoreMatch(romBase, eBase);
    let s = result.score;

    if (s >= 50) {
      const er = extractRegions(entryClean);
      if (romRegions.some(r => er.includes(r))) {
        s += 10;
      }
    }

    if (s > best.score) {
      best = { score: s, entry: entryClean, method: result.method };
    }
  }

  if (best.score >= 50 && best.entry) {
    const baseUrl = `https://thumbnails.libretro.com/${encodeURIComponent(playlist)}/Named_Boxarts/`;
    const url = baseUrl + encodeURIComponent(best.entry + ".png");
    return { url, message: `Matched Libretro Named_Boxarts: ${best.entry} (score=${best.score})` };
  }

  return { url: null, message: `No Libretro box art match found for "${title}".` };
}

export function registerScrapeRoutes(app: Express) {
  app.post("/api/roms/:id/scrape-art", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) return res.status(404).json({ message: "ROM not found." });

    const libretro = await findLibretroBoxArt(rom.system, rom.title);
    if (libretro.url) {
      const meta = {
        artUrl: libretro.url,
        scrapeStatus: "matched",
        scrapeMessage: libretro.message,
      };
      const updated = await storage.updateUploadedRomMetadata(id, meta);
      return res.json(updated);
    }

    await storage.updateUploadedRomArt(id, { artUrl: null, scrapeStatus: "failed", scrapeMessage: libretro.message });
    return res.json({ success: false, message: libretro.message });
  });

  app.post("/api/roms/scrape-all", async (req, res) => {
    const roms = await storage.listUploadedRoms();
    const unscraped = roms.filter((r) => r.scrapeStatus === "not_scraped" || r.scrapeStatus === "failed");
    if (unscraped.length === 0) return res.json({ message: "All ROMs already scraped." });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    send({ type: "start", total: unscraped.length });

    let count = 0;
    for (const rom of unscraped) {
      count++;
      send({ type: "progress", current: count, total: unscraped.length, title: rom.title });

      const libretro = await findLibretroBoxArt(rom.system, rom.title);
      if (libretro.url) {
        await storage.updateUploadedRomMetadata(rom.id, {
          artUrl: libretro.url,
          scrapeStatus: "matched",
          scrapeMessage: libretro.message,
        });
        send({ type: "result", id: rom.id, title: rom.title, status: "success" });
      } else {
        await storage.updateUploadedRomArt(rom.id, { artUrl: null, scrapeStatus: "failed", scrapeMessage: libretro.message });
        send({ type: "result", id: rom.id, title: rom.title, status: "failed" });
      }
    }

    send({ type: "complete" });
    res.end();
  });
}
