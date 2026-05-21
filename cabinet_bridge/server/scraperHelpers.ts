import path from "node:path";
import fs from "node:fs/promises";
import {
  SYSTEM_IMAGES,
  type SystemImageId,
} from "@shared/system-images";
import { dataPath } from "./data-dir";
import { storage } from "./storage";

const SYSTEM_IMAGE_CACHE_DIR = path.resolve(dataPath("system-image-cache"));
const SYSTEM_IMAGE_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "CabinetBridge/0.4 (+https://github.com/GlerschNersch/token; mailto:noreply@anthropic.com) Mozilla/5.0",
  Referer: "https://commons.wikimedia.org/",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};
const LIBRETRO_PLAYLISTS: Record<string, string> = {
  nes: "Nintendo - Nintendo Entertainment System",
  snes: "Nintendo - Super Nintendo Entertainment System",
  n64: "Nintendo - Nintendo 64",
  gba: "Nintendo - Game Boy Advance",
  genesis: "Sega - Mega Drive - Genesis",
  ps1: "Sony - PlayStation",
  ps2: "Sony - PlayStation 2",
  dreamcast: "Sega - Dreamcast",
  gb: "Nintendo - Game Boy",
  gbc: "Nintendo - Game Boy Color",
  nds: "Nintendo - Nintendo DS",
  psp: "Sony - PlayStation Portable",
  atari2600: "Atari - 2600",
  saturn: "Sega - Saturn",
  gamegear: "Sega - Game Gear",
  sms: "Sega - Master System - Mark III",
  pce: "NEC - PC Engine - TurboGrafx 16",
  sega32x: "Sega - 32X",
  segacd: "Sega - Mega-CD - Sega CD",
  neogeo: "SNK - Neo Geo",
  virtualboy: "Nintendo - Virtual Boy",
  atari7800: "Atari - 7800",
  lynx: "Atari - Lynx",
};

export async function getCachedSystemImage(
  id: SystemImageId,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
): Promise<string> {
  await fs.mkdir(SYSTEM_IMAGE_CACHE_DIR, { recursive: true });
  const cachePath = path.join(SYSTEM_IMAGE_CACHE_DIR, `${id}.jpg`);
  if (!forceRefresh) {
    try {
      const stat = await fs.stat(cachePath);
      if (stat.size > 0) return cachePath;
    } catch {
      // miss — fall through to fetch
    }
  }

  const upstream = SYSTEM_IMAGES[id].url;
  let lastError: unknown = null;
  try {
    const response = await fetch(upstream, { headers: SYSTEM_IMAGE_FETCH_HEADERS });
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 0) {
        await fs.writeFile(cachePath, buffer);
        return cachePath;
      }
      lastError = new Error("Empty image body from upstream.");
    } else {
      lastError = new Error(`Upstream returned ${response.status}.`);
    }
  } catch (error) {
    lastError = error;
  }

  // If a stale cached copy exists, prefer serving it over failing.
  try {
    const stat = await fs.stat(cachePath);
    if (stat.size > 0) return cachePath;
  } catch {
    // no stale cache
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("System image fetch failed.");
}


// ── TheGamesDB ────────────────────────────────────────────────────────────────
// Platform IDs: https://api.thegamesdb.net/v1/Platforms
const TGDB_PLATFORM_IDS: Record<string, number> = {
  nes: 7, snes: 6, n64: 3, gba: 5, genesis: 36, ps1: 10, ps2: 11,
  arcade: 23, dreamcast: 16, gb: 4, gbc: 41, nds: 8, psp: 13,
  atari2600: 22, saturn: 17, gamegear: 35, sms: 35, pce: 34,
  sega32x: 33, segacd: 21, neogeo: 24, virtualboy: 79, atari7800: 8051, lynx: 4924,
};

interface TGDBMeta {
  artUrl: string | null;
  description: string | null;
  releaseYear: number | null;
  developer: string | null;
  publisher: string | null;
  genre: string | null;
  players: string | null;
  scrapeStatus: string;
  scrapeMessage: string;
}

export async function fetchTheGamesDBMeta(system: string, title: string, apiKey: string): Promise<TGDBMeta | null> {
  if (!apiKey) return null;
  const platformId = TGDB_PLATFORM_IDS[system];
  if (!platformId) return null;

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      name: title,
      fields: "overview,genres,developers,publishers,players,rating",
      include: "boxart",
      "filter[platform]": String(platformId),
    });
    const res = await fetch(`https://api.thegamesdb.net/v1/Games/ByGameName?${params}`, {
      headers: { "User-Agent": "CabinetBridge/0.6" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;

    const games = (json?.data as Record<string, unknown>)?.games as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(games) || games.length === 0) return null;

    // Pick closest title match
    const titleLower = title.toLowerCase();
    const game = games.find((g) => String(g.game_title ?? "").toLowerCase() === titleLower) ?? games[0];

    const description = String(game.overview ?? "").trim() || null;
    const players = game.players ? String(game.players) : null;

    let releaseYear: number | null = null;
    const relDate = game.release_date as string | undefined;
    if (relDate) {
      const y = parseInt(relDate.slice(0, 4), 10);
      if (!isNaN(y)) releaseYear = y;
    }

    // Genres, developers, publishers are ID-based — look them up in include maps
    const include = json?.include as Record<string, unknown> | undefined;

    const genresMap = (include?.genres as Record<string, unknown>)?.data as Record<string, { name?: string }> | undefined;
    const gameGenreIds = game.genres as number[] | undefined;
    let genre: string | null = null;
    if (genresMap && Array.isArray(gameGenreIds)) {
      genre = gameGenreIds.slice(0, 2).map((id) => genresMap[id]?.name).filter(Boolean).join(", ") || null;
    }

    const devsMap = (include?.developers as Record<string, unknown>)?.data as Record<string, { name?: string }> | undefined;
    const devIds = game.developers as number[] | undefined;
    let developer: string | null = null;
    if (devsMap && Array.isArray(devIds) && devIds.length > 0) {
      developer = devsMap[devIds[0]]?.name ?? null;
    }

    const pubsMap = (include?.publishers as Record<string, unknown>)?.data as Record<string, { name?: string }> | undefined;
    const pubIds = game.publishers as number[] | undefined;
    let publisher: string | null = null;
    if (pubsMap && Array.isArray(pubIds) && pubIds.length > 0) {
      publisher = pubsMap[pubIds[0]]?.name ?? null;
    }

    // Box art
    let artUrl: string | null = null;
    const boxartData = (include?.boxart as Record<string, unknown>)?.data as Record<string, Array<{ side?: string; filename?: string }>> | undefined;
    const baseUrl = ((include?.boxart as Record<string, unknown>)?.base_url as Record<string, string>)?.original ?? "https://cdn.thegamesdb.net/images/original/";
    const gameId = String(game.id ?? "");
    const artList = boxartData?.[gameId];
    if (Array.isArray(artList)) {
      const front = artList.find((a) => a.side === "front") ?? artList[0];
      if (front?.filename) artUrl = baseUrl + front.filename;
    }

    return {
      artUrl,
      description,
      releaseYear,
      developer,
      publisher,
      genre,
      players,
      scrapeStatus: "matched",
      scrapeMessage: "Metadata from TheGamesDB",
    };
  } catch {
    return null;
  }
}

// ScreenScraper system IDs: https://www.screenscraper.fr/api2/systemesListe.php
const SCREENSCRAPER_SYSTEM_IDS: Record<string, number> = {
  nes: 3,
  snes: 4,
  n64: 14,
  gba: 12,
  genesis: 1,
  ps1: 57,
  ps2: 58,
  arcade: 75,
  dreamcast: 23,
  gb: 9,
  gbc: 10,
  nds: 15,
  psp: 61,
  atari2600: 26,
  saturn: 22,
  gamegear: 21,
  sms: 2,
  pce: 31,
  sega32x: 19,
  segacd: 20,
  neogeo: 142,
  virtualboy: 11,
  atari7800: 41,
  lynx: 28,
};

interface ScreenScraperMeta {
  artUrl: string | null;
  wheelArtUrl: string | null;
  videoUrl: string | null;
  communityScore: number | null;
  description: string | null;
  releaseYear: number | null;
  developer: string | null;
  publisher: string | null;
  genre: string | null;
  players: string | null;
  scrapeStatus: string;
  scrapeMessage: string;
}

export async function fetchScreenScraperMeta(
  system: string,
  romFileName: string,
  title: string,
  ssUserId: string,
  ssPassword: string,
): Promise<ScreenScraperMeta | null> {
  const systemId = SCREENSCRAPER_SYSTEM_IDS[system];
  if (!systemId) return null;

  const params = new URLSearchParams({
    devid: "cabinet_bridge",
    devpassword: "cabinet_bridge",
    softname: "cabinet_bridge",
    output: "json",
    systemeid: String(systemId),
    romtype: "rom",
    romfilename: romFileName,
  });
  if (ssUserId) params.set("ssid", ssUserId);
  if (ssPassword) params.set("sspassword", ssPassword);

  try {
    const res = await fetch(`https://www.screenscraper.fr/api2/jeuInfos.php?${params}`, {
      headers: { "User-Agent": "CabinetBridge/0.1" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const json = await res.json() as Record<string, unknown>;
    const jeu = (json?.response as Record<string, unknown>)?.jeu as Record<string, unknown> | undefined;
    if (!jeu) return null;

    // Description: prefer English, fall back to first available
    let description: string | null = null;
    const synopses = jeu.synopsis as Array<{ langue: string; text: string }> | undefined;
    if (Array.isArray(synopses)) {
      const en = synopses.find((s) => s.langue === "en");
      description = (en ?? synopses[0])?.text ?? null;
    }

    // Release year: prefer world/us region
    let releaseYear: number | null = null;
    const dates = jeu.dates as Array<{ region: string; text: string }> | undefined;
    if (Array.isArray(dates)) {
      const preferred = dates.find((d) => ["wor", "us", "eu"].includes(d.region)) ?? dates[0];
      const y = preferred?.text ? parseInt(preferred.text.slice(0, 4), 10) : NaN;
      if (!isNaN(y)) releaseYear = y;
    }

    const developer = (jeu.developpeur as { text?: string })?.text ?? null;
    const publisher = (jeu.editeur as { text?: string })?.text ?? null;

    let genre: string | null = null;
    const genres = jeu.genres as Array<{ noms: Array<{ langue: string; text: string }> }> | undefined;
    if (Array.isArray(genres) && genres.length > 0) {
      const names = genres.map((g) => {
        const en = (g.noms ?? []).find((n) => n.langue === "en");
        return (en ?? g.noms?.[0])?.text;
      }).filter(Boolean) as string[];
      genre = names.slice(0, 2).join(", ") || null;
    }

    const players = (jeu.joueurs as { text?: string })?.text ?? null;

    // Box art: prefer "box-2D" media in us/wor region
    let artUrl: string | null = null;
    let wheelArtUrl: string | null = null;
    let videoUrl: string | null = null;
    const medias = jeu.medias as Array<{ type: string; region?: string; url?: string }> | undefined;
    if (Array.isArray(medias)) {
      const boxTypes = ["box-2D", "box-2D-side", "mixrbv1"];
      for (const boxType of boxTypes) {
        const candidates = medias.filter((m) => m.type === boxType);
        const best = candidates.find((m) => ["us", "wor", "eu"].includes(m.region ?? "")) ?? candidates[0];
        if (best?.url) { artUrl = best.url; break; }
      }
      // Wheel art (logo PNG with transparent background)
      const wheelTypes = ["wheel-hd", "wheel", "wheel-carbon"];
      for (const wt of wheelTypes) {
        const w = medias.find((m) => m.type === wt);
        if (w?.url) { wheelArtUrl = w.url; break; }
      }
      // Video preview clip
      const videoTypes = ["video-normalized", "video"];
      for (const vt of videoTypes) {
        const v = medias.find((m) => m.type === vt);
        if (v?.url) { videoUrl = v.url; break; }
      }
    }

    // Community score: ScreenScraper returns note on a /20 scale
    let communityScore: number | null = null;
    const noteRaw = (jeu.note as { text?: string } | undefined)?.text;
    if (noteRaw) {
      const parsed = parseFloat(noteRaw);
      if (!isNaN(parsed)) communityScore = parsed;
    }

    return {
      artUrl,
      wheelArtUrl,
      videoUrl,
      communityScore,
      description,
      releaseYear,
      developer,
      publisher,
      genre,
      players,
      scrapeStatus: "matched",
      scrapeMessage: "Metadata from ScreenScraper.fr",
    };
  } catch {
    return null;
  }
}

export async function findLibretroBoxArt(system: string, title: string) {
  const playlist = LIBRETRO_PLAYLISTS[system];
  if (!playlist) {
    return {
      url: null,
      message: "No Libretro thumbnail playlist is configured for this system.",
    };
  }

  // Build candidate filenames in No-Intro / clean format and probe each one.
  // The thumbnails.libretro.com directory listing uses TOSEC-style names which
  // breaks fuzzy matching, but the individual files are also available under
  // the clean No-Intro names and respond correctly to HEAD requests.
  const baseUrl = `https://thumbnails.libretro.com/${encodeURIComponent(playlist)}/Named_Boxarts/`;

  // Normalise the title: strip common ROM tags, fix punctuation
  const cleanTitle = title
    .replace(/\s*\((USA|US|Europe|EU|Japan|JP|World|En|Fr|De|Es|It|Pt|Nl|Sv|No|Da|Fi|Pl|Ru|Zh|Ko|Ja|As|AU|NZ|Scan|Unl|Rev\s*[A-Z0-9]+|v[0-9.]+|Beta|Proto|Demo|Sample|Disc\s*\d+|Disk\s*\d+)\)/gi, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/[._]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Candidate filenames to probe, in priority order
  const candidates = [
    `${cleanTitle} (USA).png`,
    `${cleanTitle} (USA) (Rev 1).png`,
    `${cleanTitle} (USA) (Rev A).png`,
    `${cleanTitle} (World).png`,
    `${cleanTitle} (Europe).png`,
    `${cleanTitle} (Japan).png`,
    `${cleanTitle}.png`,
  ];

  for (const filename of candidates) {
    const url = baseUrl + encodeURIComponent(filename);
    try {
      const probe = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "CabinetBridge/0.1" },
        signal: AbortSignal.timeout(6000),
      });
      if (probe.ok) {
        return { url, message: `Matched Libretro Named_Boxarts: ${filename}` };
      }
    } catch {
      // network error — try next candidate
    }
  }

  return { url: null, message: `No Libretro box art match found for "${title}".` };
}

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeSearchTitle(value: string) {
  return significantTokens(normalizeTitle(value)).join(" ");
}

export function significantTokens(value: string) {
  const noise = new Set([
    "u",
    "usa",
    "us",
    "eng",
    "snes",
    "sfc",
    "smc",
    "rev",
    "version",
  ]);
  const roman: Record<string, string> = {
    i: "1",
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
    x: "10",
  };
  const rawTokens = value.split(/\s+/).filter(Boolean);
  return rawTokens
    .filter((token, index, tokens) => {
      if (noise.has(token)) return false;
      if (token === "v" && /^\d+$/.test(tokens[index + 1] ?? "")) return false;
      if (/^\d+$/.test(token) && tokens[index - 1] === "v") return false;
      return true;
    })
    .map((token) => roman[token] ?? token);
}

export function numberTokens(tokens: string[]) {
  return tokens.filter((token) => /^\d+$/.test(token));
}

export function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function titleFromFileName(fileName: string) {
  return path
    .basename(fileName, path.extname(fileName))
    // Strip No-Intro / TOSEC region tags e.g. (U), (USA), (E), (Europe), (J), (Japan), (Germany), (Fr), etc.
    .replace(/\s*\([A-Z][a-zA-Z,\s]*\)/g, "")
    // Strip No-Intro verification flags e.g. [!], [a], [b], [t], [o], [f], [h], [T+...], [b2]
    .replace(/\s*\[[^\]]*\]/g, "")
    // Strip revision / version tags e.g. (Rev 1), (Rev A), (v1.1), (Beta), (Proto), (Demo)
    .replace(/\s*\((Rev|v|Beta|Proto|Demo|Sample|Hack|Alt|Unl)[^)]*\)/gi, "")
    // Strip disc/disk tags e.g. (Disc 1), (Disk A)
    .replace(/\s*\(Dis[ck][^)]*\)/gi, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "rom"
  );
}
