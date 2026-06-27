import type { Express } from "express";
import express from "express";
import { storage } from "../storage";
import { 
  ROM_EXTENSIONS, MAX_UPLOAD_MB, MAX_UPLOAD_BYTES, 
  EMULATORJS_CORES, ROM_ROOT, getUserFromRequest 
} from "./shared";
import { renderEmulatorPage, renderEmulatorBootstrap, renderPlayerError, renderBootstrapError } from "./player";
import { REQUIRED_BIOS } from "@shared/bios-metadata";
import { dataPath } from "../data-dir";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import { insertUploadedRomSchema, type UploadedRom } from "@shared/schema";
import { extractFirstRomFromZip, titleFromFileName, slugify, getAbsoluteFilePath, detectSystemFromContent } from "./utils";
import { findLibretroBoxArt } from "./scrape";
import { getHltbData } from "../hltb";
import QRCode from "qrcode";

// ── EmulatorJS asset disk cache ─────────────────────────────────────────────
// Caches CDN assets on disk so repeated visits (or different users launching
// the same core) don't re-fetch the same WASM / JS from the internet.
const EJS_CACHE_DIR = dataPath("ejs_cache");
let ejsCacheDirReady = false;
async function ensureEjsCacheDir() {
  if (ejsCacheDirReady) return;
  await fs.mkdir(EJS_CACHE_DIR, { recursive: true });
  ejsCacheDirReady = true;
}

export function registerRomRoutes(app: Express) {
  const BIOS_ROOT = dataPath("bios");

  // ── Generic art proxy — bypasses CORS for any artUrl, caches to disk ───────
  // Used for demo/seeded games whose artUrl points to Libretro/ScreenScraper.
  app.get("/api/art", async (req, res) => {
    const artUrl = String(req.query.url ?? "");
    if (!artUrl) return res.status(400).send("No art URL provided");

    // Sanity-check: only allow known art CDN origins
    const allowedOrigins = [
      "thumbnails.libretro.com",
      "mediaspeed.libretro.com",
    ];
    let origin: string | null = null;
    try { origin = new URL(artUrl).host; } catch {}
    if (!origin || !allowedOrigins.some((o) => origin === o)) {
      return res.status(400).send("Disallowed art origin");
    }

    const cacheDir = dataPath("art-cache");
    const safeName = Buffer.from(artUrl).toString("base64url").slice(0, 80) + ".jpg";
    const cachePath = path.join(cacheDir, safeName);

    try {
      const exists = await fs.access(cachePath).then(() => true).catch(() => false);
      if (exists) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.sendFile(cachePath);
      }
    } catch {}

    try {
      const upstream = await fetch(artUrl, {
        headers: { "User-Agent": "CabinetBridge/0.1", Referer: artUrl },
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok || !upstream.body) return res.status(502).json({ message: "Failed to fetch art." });


      const ct = upstream.headers.get("Content-Type") ?? "image/jpeg";
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");


      await fs.mkdir(cacheDir, { recursive: true }).catch(() => {});
      const { Readable } = await import("stream");
      const chunks: Buffer[] = [];


      for await (const chunk of Readable.fromWeb(upstream.body as any)) {
        res.write(chunk);
        chunks.push(Buffer.from(chunk));
      }
      res.end();

      fs.writeFile(cachePath, Buffer.concat(chunks)).catch(() => {});
    } catch (err) {
      console.error("[Art] Generic proxy failed:", artUrl, err);
      res.status(502).json({ message: "Art fetch error." });
    }
  });

  app.get("/api/roms/warp-qr", async (req, res) => {
    const url = String(req.query.url ?? "");
    if (!url) return res.status(400).send("No URL provided");
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 400,
        color: { dark: "#000000", light: "#ffffff" }
      });
      res.json({ dataUrl });
    } catch (err) {
      res.status(500).json({ message: "QR generation failed" });
    }
  });

  app.get("/api/upload-limits", (_req, res) => {
    res.json({
      maxUploadMb: MAX_UPLOAD_MB,
      maxUploadBytes: MAX_UPLOAD_BYTES,
      allowedExtensions: ROM_EXTENSIONS,
    });
  });

  app.post("/api/upload/check-duplicates", express.json({ limit: "1mb" }), async (req, res) => {
    try {
      const { files: entries } = req.body as { files: { name: string; size: number }[] };
      if (!Array.isArray(entries)) {
        return res.status(400).json({ message: "files array required" });
      }
      const results: { originalName: string; duplicate: UploadedRom | null; matchBy: string }[] = [];
      for (const entry of entries) {
        const byName = await storage.findRomByOriginalName(entry.name);
        if (byName) {
          results.push({ originalName: entry.name, duplicate: byName, matchBy: "originalName" });
        } else {
          results.push({ originalName: entry.name, duplicate: null, matchBy: "" });
        }
      }
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Check failed" });
    }
  });

  app.post("/api/roms/:id/replace", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getUploadedRom(id);
      if (!existing) return res.status(404).json({ message: "ROM not found." });

      const originalName = decodeURIComponent(String(req.header("x-rom-filename") ?? existing.originalName));
      const extension = path.extname(originalName).toLowerCase();
      const filePath = existing.filePath;

      // Stream new file to disk, replacing the old one
      const hash = crypto.createHash("md5");
      let totalSize = 0;
      try {
        const sizeAndHashTransform = new Transform({
          transform(chunk, _encoding, callback) {
            totalSize += chunk.length;
            hash.update(chunk);
            callback(null, chunk);
          },
        });
        const writeStream = fsSync.createWriteStream(filePath);
        await pipeline(req, sizeAndHashTransform, writeStream);
      } catch (err: any) {
        return res.status(500).json({ message: "Replace failed" });
      }

      const romHash = hash.digest("hex");
      const title = titleFromFileName(originalName);
      const discMatch = title.match(/\s*[\(\[](?:disc|disk|cd)\s*(\d+)[\)\]]|\s+(?:disc|disk|cd)\s*(\d+)/i);
      const cleanTitle = discMatch ? title.replace(discMatch[0], "").trim() : title;

      const updated = await storage.updateUploadedRomFile(id, {
        title: cleanTitle,
        originalName,
        size: totalSize,
        romHash,
      });

      await storage.relinkSaveSlotsByHash(id, romHash);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Replace failed" });
    }
  });

  app.post("/api/upload/detect", async (req, res) => {
    try {
      const fileName = String(req.query.filename ?? "");
      const folderName = String(req.query.folder ?? "").trim() || undefined;
      if (!fileName) {
        return res.status(400).json({ message: "filename query param required" });
      }

      // Read up to 64 KB from the request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
        if (Buffer.concat(chunks).length >= 65536) break;
      }
      const magicBytes = Buffer.concat(chunks).slice(0, 65536);

      const result = detectSystemFromContent(fileName, magicBytes, folderName);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Detection failed" });
    }
  });

  app.post(
    "/api/roms/upload",
    async (req, res) => {
      const system = String(req.query.system ?? "");
      const favorite = req.query.favorite !== "0";
      const allowedExtensions = ROM_EXTENSIONS[system];

      if (!allowedExtensions) {
        return res.status(400).json({ message: "Choose a supported console before uploading." });
      }

      const originalName = decodeURIComponent(String(req.header("x-rom-filename") ?? "uploaded.rom"));
      const extension = path.extname(originalName).toLowerCase();
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
        return res.status(400).json({ message: `Unsupported file type for ${system}. Allowed: ${allowedExtensions.join(", ")}` });
      }

      const baseSlug = slugify(titleFromFileName(originalName));
      const uniqueSuffix = Date.now().toString(36);
      const slug = `${system}_${baseSlug}_${uniqueSuffix}`;
      const safeName = `${slug}${extension}`;
      const systemDir = path.join(ROM_ROOT, system);
      const filePath = path.join(systemDir, safeName);

      await fs.mkdir(systemDir, { recursive: true });

      const hash = crypto.createHash("md5");
      let totalSize = 0;

      try {
        const sizeAndHashTransform = new Transform({
          transform(chunk, _encoding, callback) {
            totalSize += chunk.length;
            if (totalSize > MAX_UPLOAD_BYTES) {
              callback(new Error("File too large"));
              return;
            }
            hash.update(chunk);
            callback(null, chunk);
          },
        });

        const writeStream = fsSync.createWriteStream(filePath);
        await pipeline(req, sizeAndHashTransform, writeStream);
      } catch (err: any) {
        if (fsSync.existsSync(filePath)) await fs.unlink(filePath).catch(() => {});
        return res.status(err.message === "File too large" ? 413 : 500).json({
          message: err.message === "File too large" ? `File exceeds ${MAX_UPLOAD_MB}MB limit` : "Upload failed",
        });
      }

      const romHash = hash.digest("hex");
      const isM3u = extension === ".m3u";

      let m3uContent: string | null = null;
      let isPlaylist = false;
      let parentM3uId: number | null = null;
      let title: string;
      let discNumber: number | null;
      let cleanTitle: string;
      let discGroup: string | null;

      if (isM3u) {
        isPlaylist = true;
        m3uContent = await fs.readFile(filePath, "utf8").catch(() => null);
        title = titleFromFileName(originalName);
        discNumber = null;
        cleanTitle = title;
        discGroup = null;
      } else {
        title = titleFromFileName(originalName);
        const discMatch = title.match(/\s*[\(\[](?:disc|disk|cd)\s*(\d+)[\)\]]|\s+(?:disc|disk|cd)\s*(\d+)/i);
        discNumber = discMatch ? parseInt(discMatch[1] ?? discMatch[2], 10) : null;
        cleanTitle = discMatch ? title.replace(discMatch[0], "").trim() : title;
        discGroup = discMatch ? `${system}/${slugify(cleanTitle)}` : null;

        // Check if a matching M3U already exists in DB for this file
        if (discGroup) {
          const existingM3u = await storage.findM3uForDiscGroup(discGroup);
          if (existingM3u) {
            parentM3uId = existingM3u.id;
          }
        }
      }

      const libretroArt = await findLibretroBoxArt(system, isM3u ? title : cleanTitle);

      const rom = insertUploadedRomSchema.parse({
        title: isM3u ? title : cleanTitle,
        system,
        slug,
        originalName,
        fileName: safeName,
        filePath,
        size: totalSize,
        mimeType: req.header("content-type") ?? "application/octet-stream",
        artUrl: libretroArt.url,
        scrapeStatus: libretroArt.url ? "matched" : "not_found",
        scrapeMessage: libretroArt.message ?? "",
        favorite,
        rating: 0,
        lastPlayed: 0,
        playCount: 0,
        discNumber,
        discGroup,
        isPlaylist,
        m3uContent,
        parentM3uId,
        romHash,
        minutesPlayed: 0,
        createdAt: Date.now(),
      });

      const saved = await storage.createUploadedRom(rom);

      // Re-sync progress if this exact ROM file was uploaded before
      if (romHash && !isM3u) {
        await storage.relinkSaveSlotsByHash(saved.id, romHash);
      }

      // If this is an M3U, link any existing disc records via parentM3uId
      if (isM3u && m3uContent) {
        const refs = m3uContent.split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0 && !l.startsWith("#"));
        for (const ref of refs) {
          const existing = await storage.findRomByOriginalName(ref);
          if (existing && !existing.isPlaylist && !existing.parentM3uId) {
            await storage.updateUploadedRomFile(existing.id, { parentM3uId: saved.id });
          }
        }
        // Also check discGroup-based linking: find discs whose clean title matches
        const baseTitle = slugify(title);
        const grouped = await storage.listRomsByDiscGroupNoM3u(`${system}/${baseTitle}`);
        for (const disc of grouped) {
          if (!disc.parentM3uId) {
            await storage.updateUploadedRomFile(disc.id, { parentM3uId: saved.id });
          }
        }
      }

      // Auto-generate M3U for discGroup clusters that lack one
      if (!isM3u && discGroup && !parentM3uId) {
        const siblings = await storage.listRomsByDiscGroupNoM3u(discGroup);
        const m3uExists = await storage.findM3uForDiscGroup(discGroup);
        if (siblings.length >= 2 && !m3uExists) {
          // Generate M3U content from sibling filenames
          const m3uLines = siblings
            .sort((a, b) => (a.discNumber ?? 0) - (b.discNumber ?? 0))
            .map(s => s.originalName)
            .join("\n");

          const m3uSlug = `${system}_m3u_${slugify(cleanTitle)}_${Date.now().toString(36)}`;
          const m3uFilePath = path.join(systemDir, `${m3uSlug}.m3u`);
          const m3uRom = insertUploadedRomSchema.parse({
            title: cleanTitle,
            system,
            slug: m3uSlug,
            originalName: `${cleanTitle}.m3u`,
            fileName: `${m3uSlug}.m3u`,
            filePath: m3uFilePath,
            size: Buffer.byteLength(m3uLines, "utf8"),
            mimeType: "text/plain",
            artUrl: libretroArt.url,
            scrapeStatus: libretroArt.url ? "matched" : "not_found",
            scrapeMessage: libretroArt.message ?? "",
            favorite,
            rating: 0,
            lastPlayed: 0,
            playCount: 0,
            discNumber: null,
            discGroup,
            isPlaylist: true,
            m3uContent: m3uLines,
            parentM3uId: null,
            romHash: null,
            minutesPlayed: 0,
            createdAt: Date.now(),
          });
          const m3uRecord = await storage.createUploadedRom(m3uRom);
          // Link all siblings to the new M3U
          for (const sib of siblings) {
            await storage.updateUploadedRomFile(sib.id, { parentM3uId: m3uRecord.id });
          }
        }
      }

      res.status(201).json(saved);
    },
  );

  app.get("/api/roms/:id/hltb", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rom = await storage.getUploadedRom(id);
      if (!rom) return res.status(404).json({ message: "ROM not found." });

      const data = await getHltbData(rom.id, rom.title);
      if (!data) return res.json({ found: false });
      res.json({ ...data, found: true });
    } catch (err) {
      console.error("[HLTB] Proxy error:", err);
      res.status(500).json({ found: false });
    }
  });

  app.get("/api/roms", async (req, res) => {
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? "100"), 10) || 100));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10) || 0);
    const excludeChildren = req.query.exclude_children === "true";
    const roms = await storage.listUploadedRomsPaginated(limit, offset, excludeChildren);
    const total = await storage.countUploadedRoms(excludeChildren);
    const hasMore = offset + roms.length < total;
    // Trim null/empty fields to shrink payload size for large libraries
    const trimmed = roms.map(rom => {
      const lean: any = {
        id: rom.id,
        title: rom.title,
        system: rom.system,
        slug: rom.slug,
        fileName: rom.fileName
      };
      if (rom.artUrl) lean.artUrl = rom.artUrl;
      if (rom.favorite) lean.favorite = true;
      if (rom.rating) lean.rating = rom.rating;
      if (rom.lastPlayed) lean.lastPlayed = rom.lastPlayed;
      if (rom.playCount) lean.playCount = rom.playCount;
      if (rom.minutesPlayed) lean.minutesPlayed = rom.minutesPlayed;
      if (rom.playStatus && rom.playStatus !== 'unset') lean.playStatus = rom.playStatus;
      if (rom.romHash) lean.romHash = rom.romHash;
      if (rom.discGroup) lean.discGroup = rom.discGroup;
      if (rom.discNumber) lean.discNumber = rom.discNumber;
      if (rom.isPlaylist) lean.isPlaylist = true;
      if (rom.parentM3uId) lean.parentM3uId = rom.parentM3uId;
      return lean;
    });
    res.json({ roms: trimmed, total, hasMore });
  });

  app.get("/api/roms/:id", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) {
      return res.status(404).json({ message: "Uploaded ROM not found." });
    }
    res.json(rom);
  });

  app.get("/api/roms/:id/video", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) return res.status(404).json({ message: "ROM not found." });
    const videoUrl = (rom as any).videoUrl as string | null;
    if (!videoUrl) return res.status(404).json({ message: "No video available." });
    try {
      const upstream = await fetch(videoUrl, {
        headers: { "User-Agent": "CabinetBridge/0.1" },
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok || !upstream.body) {
        return res.status(502).json({ message: "Failed to fetch video." });
      }
      res.setHeader("Content-Type", upstream.headers.get("Content-Type") ?? "video/mp4");
      const cl = upstream.headers.get("Content-Length");
      if (cl) res.setHeader("Content-Length", cl);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      const { Readable } = await import("stream");
      Readable.fromWeb(upstream.body as any).pipe(res);
    } catch {
      res.status(502).json({ message: "Video fetch error." });
    }
  });

  app.get("/api/roms/:id/art", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) return res.status(404).json({ message: "ROM not found." });

    const artUrl = (rom as any).artUrl as string | null;
    if (!artUrl) return res.status(404).json({ message: "No art available." });

    // Check disk cache first
    const cacheDir = path.resolve(dataPath("art-cache"));
    const safeName = `${id}-${Buffer.from(artUrl).toString("base64url").slice(0, 64)}`;
    const cachePath = path.join(cacheDir, safeName.replace(/[/\\?%*:|"<>/]/g, "_") + ".jpg");

    // Serve from cache if exists
    try {
      const exists = await fs.access(cachePath).then(() => true).catch(() => false);
      if (exists) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.sendFile(cachePath);
      }
    } catch {}

    // Fetch from upstream
    try {
      const upstream = await fetch(artUrl, {
        headers: { "User-Agent": "CabinetBridge/0.1", Referer: artUrl },
        signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok || !upstream.body) return res.status(502).json({ message: "Failed to fetch art." });

      const ct = upstream.headers.get("Content-Type") ?? "image/jpeg";
      res.setHeader("Content-Type", ct);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      // Stream to browser AND save to disk cache
      await fs.mkdir(cacheDir, { recursive: true }).catch(() => {});
      const { Readable } = await import("stream");
      const chunks: Buffer[] = [];

      for await (const chunk of Readable.fromWeb(upstream.body as any)) {
        res.write(chunk);
        chunks.push(Buffer.from(chunk));
      }
      res.end();

      // Write to cache asynchronously after response
      fs.writeFile(cachePath, Buffer.concat(chunks)).catch(() => {});
    } catch (err) {
      console.error(`[Art] Failed to proxy art for ROM ${id}:`, err);
      res.status(502).json({ message: "Art fetch error." });
    }
  });

  // ── EmulatorJS CDN proxy with disk cache ──────────────────────────────────
  // Assets are immutable once fetched (WASM, JS cores, etc.).
  // We cache them on disk so subsequent requests are served locally at LAN
  // speed (~100-1000×) instead of round-tripping to the CDN every time.
  app.get("/api/emulatorjs/*path", async (req, res) => {
    const filePath = Array.isArray(req.params.path)
      ? (req.params.path as string[]).join("/")
      : ((req.params as any).path ?? "");
    if (!filePath || filePath.includes("..")) {
      return res.status(400).send("Invalid path");
    }

    await ensureEjsCacheDir();

    // Determine content-type from extension
    const ext = path.extname(filePath).toLowerCase();
    const MIME: Record<string, string> = {
      ".js": "application/javascript",
      ".wasm": "application/wasm",
      ".data": "application/octet-stream",
      ".mem": "application/octet-stream",
      ".json": "application/json",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
    };
    const contentType = MIME[ext] ?? "application/octet-stream";

    // Sanitize the CDN path to a safe cache key (replace slashes with __ to keep flat)
    const cacheKey = filePath.replace(/[\/\\]/g, "__");
    const cachePath = path.join(EJS_CACHE_DIR, cacheKey);

    // Serve from disk cache if available
    try {
      const stat = await fs.stat(cachePath);
      if (stat.isFile() && stat.size > 0) {
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", String(stat.size));
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        // Support Range requests so browsers can stream large WASM files
        const rangeHeader = req.headers.range;
        if (rangeHeader) {
          const parts = rangeHeader.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunkSize = end - start + 1;
          res.setHeader("Accept-Ranges", "bytes");
          res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
          res.setHeader("Content-Length", String(chunkSize));
          res.status(206);
          fsSync.createReadStream(cachePath, { start, end }).pipe(res);
        } else {
          res.setHeader("Accept-Ranges", "bytes");
          fsSync.createReadStream(cachePath).pipe(res);
        }
        return;
      }
    } catch {
      // not cached yet — fall through to CDN fetch
    }

    // Fetch from CDN and simultaneously write to disk cache + stream to client
    const cdnUrl = `https://cdn.emulatorjs.org/stable/data/${filePath}`;
    try {
      const upstream = await fetch(cdnUrl, {
        headers: { "User-Agent": "CabinetBridge/0.1" },
        signal: AbortSignal.timeout(30000),
      });
      if (!upstream.ok || !upstream.body) {
        return res.status(upstream.status).send("CDN error");
      }
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      const cl = upstream.headers.get("Content-Length");
      if (cl) res.setHeader("Content-Length", cl);

      const { Readable, PassThrough } = await import("stream");
      const readable = Readable.fromWeb(upstream.body as any);
      const passToClient = new PassThrough();
      const passToCache = new PassThrough();

      readable.pipe(passToClient);
      readable.pipe(passToCache);

      passToClient.pipe(res);

      // Write cache file in background; don't block or fail the response
      const tmpPath = `${cachePath}.tmp`;
      const writeStream = fsSync.createWriteStream(tmpPath);
      passToCache.pipe(writeStream);
      writeStream.on("finish", () => {
        fsSync.rename(tmpPath, cachePath, () => {});
      });
      writeStream.on("error", () => {
        fsSync.unlink(tmpPath, () => {});
      });
    } catch {
      res.status(502).send("EmulatorJS CDN unreachable");
    }
  });

  // ── ROM file download — Range-aware so browsers can stream large ROMs ─────
  // Without Accept-Ranges the browser must fully buffer the ROM before
  // EmulatorJS can start the core.  With Range support it can begin booting
  // as soon as the first chunk arrives.
  app.get("/api/roms/:id/file", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) {
      return res.status(404).json({ message: "Uploaded ROM not found." });
    }
    const settings = await storage.getIntegrationSettings();
    const watchPaths = (settings.libraryWatchPaths ?? "")
      .split(",")
      .map((p) => path.resolve(p.trim()))
      .filter(Boolean);
    const safeRoots = [
      `${ROM_ROOT}${path.sep}`,
      ...watchPaths.map((p) => `${p}${path.sep}`)
    ];
    const resolvedPath = getAbsoluteFilePath(rom, watchPaths);
    const resolved = resolvedPath.replace(/\\/g, "/");
    const isWin = process.platform === "win32";
    const isSafe = safeRoots.some((root) => {
      const normalizedRoot = root.replace(/\\/g, "/");
      if (isWin) {
        return resolved.toLowerCase().startsWith(normalizedRoot.toLowerCase());
      }
      return resolved.startsWith(normalizedRoot);
    });
    if (!isSafe) {
      return res.status(403).json({ message: "ROM path is outside the storage directory." });
    }

    let stat: fsSync.Stats;
    try {
      stat = fsSync.statSync(resolvedPath);
    } catch {
      return res.status(404).json({ message: "ROM file not found on disk." });
    }

    const mimeType = rom.mimeType || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${rom.originalName.replace(/"/g, "")}"`);
    res.setHeader("Accept-Ranges", "bytes");
    // 1-hour browser cache for ROMs (immutable content, large files)
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        res.setHeader("Content-Range", `bytes */${stat.size}`);
        return res.status(416).end();
      }
      const chunkSize = end - start + 1;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      res.setHeader("Content-Length", String(chunkSize));
      res.status(206);
      fsSync.createReadStream(resolvedPath, { start, end }).pipe(res);
    } else {
      res.setHeader("Content-Length", String(stat.size));
      fsSync.createReadStream(resolvedPath).pipe(res);
    }
  });

  app.get("/api/roms/:id/discs", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) return res.status(404).json({ message: "Uploaded ROM not found." });
    if (rom.isPlaylist) {
      const children = await storage.listChildrenByM3uId(rom.id);
      if (children.length > 0) return res.json(children);
    }
    if (rom.parentM3uId) {
      const children = await storage.listChildrenByM3uId(rom.parentM3uId);
      if (children.length > 0) return res.json(children);
    }
    if (!rom.discGroup) return res.json([rom]);
    const discs = await storage.listRomsByDiscGroup(rom.discGroup);
    res.json(discs.length > 0 ? discs : [rom]);
  });

  app.get("/api/roms/:id/player", async (req, res) => {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) return res.status(404).send(renderPlayerError("Uploaded ROM not found."));
    const core = EMULATORJS_CORES[rom.system];
    if (!core) return res.status(400).send(renderPlayerError(`${rom.system.toUpperCase()} is not configured for browser play yet.`));
    await storage.markUploadedRomPlayed(id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Short cache: the HTML shell rarely changes but we don't want stale BIOS errors
    res.setHeader("Cache-Control", "private, max-age=60");
    res.removeHeader("X-Frame-Options");
    const returnTo = typeof req.query.return === "string" ? req.query.return : "";
    const qString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    res.send(renderEmulatorPage({ 
      title: rom.title, 
      returnTo, 
      romHash: rom.romHash ?? null, 
      queryString: qString,
      system: rom.system 
    }));
  });

  app.get("/api/roms/:id/bootstrap.js", async (req, res) => {
    try {
    const id = Number(req.params.id);
    const rom = await storage.getUploadedRom(id);
    if (!rom) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      return res.status(404).send(`document.body.textContent = "Uploaded ROM not found.";`);
    }
    const core = EMULATORJS_CORES[rom.system];
    if (!core) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      return res.status(400).send(`document.body.textContent = ${JSON.stringify(`${rom.system.toUpperCase()} is not configured for browser play yet.`)};`);
    }
    let discs: Array<{ id: number; label: string }> = [];
    let gameUrlIsArray = false;

    if (rom.isPlaylist && rom.m3uContent) {
      // M3U record — resolve each referenced file to a child disc record
      const refs = rom.m3uContent.split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("#"));
      const children = await storage.listChildrenByM3uId(rom.id);
      if (children.length > 1) {
        discs = children.map((s) => ({ id: s.id, label: s.discNumber ? `Disc ${s.discNumber}` : s.title }));
        gameUrlIsArray = true;
      } else if (refs.length > 0) {
        // Try to find children by originalName match
        const resolved: typeof discs = [];
        for (const ref of refs) {
          const found = children.find(c => c.originalName === ref) ?? await storage.findRomByOriginalName(ref);
          if (found) resolved.push({ id: found.id, label: found.discNumber ? `Disc ${found.discNumber}` : found.title });
        }
        if (resolved.length > 1) {
          discs = resolved;
          gameUrlIsArray = true;
        }
      }
    } else if (rom.discGroup) {
      const siblings = await storage.listRomsByDiscGroup(rom.discGroup);
      if (siblings.length > 1) {
        discs = siblings.map((s) => ({ id: s.id, label: s.discNumber ? `Disc ${s.discNumber}` : s.title, }));
        gameUrlIsArray = true;
      }
    } else if (rom.parentM3uId) {
      // Child disc — include siblings for disc switching
      const children = await storage.listChildrenByM3uId(rom.parentM3uId);
      if (children.length > 1) {
        discs = children.map((s) => ({ id: s.id, label: s.discNumber ? `Disc ${s.discNumber}` : s.title }));
      }
    }
    const bootstrapSettings = await storage.getIntegrationSettings();
    const { userId: haUserId, userName } = getUserFromRequest(req);
    const profileParam = req.query.profile ? String(req.query.profile) : null;
    const pId = profileParam && !isNaN(Number(profileParam)) ? Number(profileParam) : 1;
    const userId = profileParam ? `profile_${profileParam}` : haUserId;

    const netplayRole = req.query.netplay_role ? String(req.query.netplay_role) : null;
    const netplayRoom = req.query.netplay_room ? String(req.query.netplay_room) : null;

    // Detect the Home Assistant Ingress base path for injected URLs
    const ingressMatch = req.originalUrl.match(/^\/api\/(?:hassio_)?ingress\/[^\/]+/);
    const ingressBase = ingressMatch ? ingressMatch[0] : "";

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    // Bootstrap content is stable for a given ROM+profile combination;
    // a short cache avoids regenerating it on every page reload.
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    const coreBios = REQUIRED_BIOS[core] || [];
    let biosUrl: string | null = null;
    for (const meta of coreBios) {
      try {
        await fs.access(path.join(BIOS_ROOT, meta.filename));
        biosUrl = `${ingressBase}/api/bios/file/${meta.filename}`;
        break;
      } catch {
      }
    }

    // BIOS gate: if this core requires a BIOS and none is present, surface a
    // clear error in the launch overlay instead of silently hanging.
    // NOTE: For genesis_plus_gx, we ONLY require a BIOS if the system is Sega CD.
    const skipBiosCheck = (core === "genesis_plus_gx" && rom.system !== "segacd");

    if (coreBios.length > 0 && !biosUrl && !skipBiosCheck) {
      const missing = coreBios.map(m => m.filename).join(" or ");
      return res.send(renderBootstrapError(`BIOS required — upload ${missing} in the BIOS tab before playing this system.`));
    }

    res.send(renderEmulatorBootstrap({
      core, title: rom.title, gameId: `${rom.system}-${rom.slug}`, romId: rom.id, discs, romHash: rom.romHash ?? null, gameUrlIsArray,
      raUsername: bootstrapSettings.raUsername ?? "", raToken: bootstrapSettings.raToken ?? "",
      controlDefaults: await (async () => {
        const global = (bootstrapSettings.controlDefaults ?? {}) as Record<string, Record<number, string>>;
        const merged: Record<string, Record<number, string>> = { ...global };
        const profileBindings = await storage.getProfileControlBindings(pId, core);
        if (profileBindings && Object.keys(profileBindings).length > 0) merged[core] = { ...(global[core] ?? {}), ...profileBindings };
        return merged;
      })(),
      gamepadBindings: await (async () => {
        return (await storage.getGamepadBindings(pId, "default")) || {};
      })(),
      keyboardBindings: await (async () => {
        return (await storage.getGamepadBindings(pId, "keyboard")) || {};
      })(),
      controlDefaultsP2: await (async () => {
        return (await storage.getProfileControlBindings(pId, `${core}_p2`)) || {};
      })(),
      gamepadBindingsP2: await (async () => {
        return (await storage.getGamepadBindings(pId, "default_p2")) || {};
      })(),
      gamepadRumble: bootstrapSettings.gamepadRumble ?? true,
      systemDisplay: (bootstrapSettings.systemDisplay ?? {}) as Record<string, any>,
      globalAspectRatio: bootstrapSettings.globalAspectRatio || "auto",
      globalShader: bootstrapSettings.globalShader || "none",
      userId, userName, profileId: String(pId),
      cheats: await storage.listCheats(rom.id, pId).then((cs) => cs.filter((c) => c.enabled)),
      biosUrl,
      netplayRole,
      netplayRoom,
      netplaySyncMode: bootstrapSettings.netplaySyncMode || "rollback",
    }));
    } catch (err: any) {
      console.error(`[HomeArcade] bootstrap.js error for ROM ${req.params.id}:`, err);
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      // Return 200 so the browser actually executes the script and shows the failure state
      res.status(200).send(renderBootstrapError("Server error: " + (err?.message || "Internal failure")));
    }
  });

  app.patch("/api/roms/:id/rating", async (req, res) => {
    const id = Number(req.params.id);
    const parsed = z.object({ rating: z.number().int().min(0).max(5) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Rating must be a whole number from 0 to 5." });
    const updated = await storage.updateUploadedRomRating(id, parsed.data.rating);
    if (!updated) return res.status(404).json({ message: "Uploaded ROM not found." });
    res.json(updated);
  });

  app.patch("/api/roms/:id/favorite", async (req, res) => {
    const id = Number(req.params.id);
    const parsed = z.object({ favorite: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Favorite must be true or false." });
    const updated = await storage.updateUploadedRomFavorite(id, parsed.data.favorite);
    if (!updated) return res.status(404).json({ message: "Uploaded ROM not found." });
    res.json(updated);
  });

  app.patch("/api/roms/:id/play-status", async (req, res) => {
    const id = Number(req.params.id);
    const VALID = ["unset", "backlog", "playing", "completed", "dropped"];
    const parsed = z.object({ playStatus: z.string() }).safeParse(req.body);
    if (!parsed.success || !VALID.includes(parsed.data.playStatus)) return res.status(400).json({ message: "Invalid play status." });
    const updated = await storage.updateUploadedRomPlayStatus(id, parsed.data.playStatus);
    if (!updated) return res.status(404).json({ message: "Uploaded ROM not found." });
    res.json(updated);
  });

  app.delete("/api/roms", async (req, res) => {
    const settings = await storage.getIntegrationSettings();
    const watchPaths = (settings.libraryWatchPaths ?? "")
      .split(",")
      .map((p) => path.resolve(p.trim()))
      .filter(Boolean);

    const safeRoot = `${ROM_ROOT}${path.sep}`.replace(/\\/g, "/");
    const isWin = process.platform === "win32";

    const allRoms = await storage.listUploadedRoms();
    let filesRemoved = 0;
    let filesFailed = 0;

    for (const rom of allRoms) {
      const resolvedPath = getAbsoluteFilePath(rom, watchPaths);
      const resolved = resolvedPath.replace(/\\/g, "/");
      const isMatched = isWin
        ? resolved.toLowerCase().startsWith(safeRoot.toLowerCase())
        : resolved.startsWith(safeRoot);
      if (isMatched) {
        try { await fs.unlink(resolvedPath); filesRemoved++; } catch { filesFailed++; }
      }
      await storage.deleteUploadedRom(rom.id);
    }

    res.json({ deleted: true, romsRemoved: allRoms.length, filesRemoved, filesFailed });
  });

  app.delete("/api/roms/:id", async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteUploadedRom(id);
    if (!deleted) return res.status(404).json({ message: "Uploaded ROM not found." });
    const safeRoot = `${ROM_ROOT}${path.sep}`.replace(/\\/g, "/");
    const settings = await storage.getIntegrationSettings();
    const watchPaths = (settings.libraryWatchPaths ?? "")
      .split(",")
      .map((p) => path.resolve(p.trim()))
      .filter(Boolean);
    const resolvedPath = getAbsoluteFilePath(deleted, watchPaths);
    const resolved = resolvedPath.replace(/\\/g, "/");
    let fileRemoved = false;
    const isWin = process.platform === "win32";
    const isMatched = isWin
      ? resolved.toLowerCase().startsWith(safeRoot.toLowerCase())
      : resolved.startsWith(safeRoot);
    if (isMatched) {
      try { await fs.unlink(resolvedPath); fileRemoved = true; } catch { fileRemoved = false; }
    }
    res.json({ deleted: true, id: deleted.id, fileRemoved });
  });
}
