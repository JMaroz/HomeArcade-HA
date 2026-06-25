/**
 * scanner.ts
 *
 * Enhanced ROM scanner — v2.1 (Performance Optimized)
 *
 * Polls every 60 seconds. Uses async FS calls and bulk DB inserts
 * to prevent blocking the Node.js event loop during large library scans.
 */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Lookup tables
// ─────────────────────────────────────────────────────────────────────────────

const EXT_TO_SYSTEM: Record<string, string> = {
  ".nes":  "nes",
  ".smc":  "snes",  ".sfc":  "snes",
  ".md":   "genesis", ".gen": "genesis", ".bin": "genesis",
  ".z64":  "n64",  ".n64":  "n64",  ".v64":  "n64",
  ".gb":   "gb",
  ".gbc":  "gbc",
  ".gba":  "gba",
  ".nds":  "nds",
  ".3ds":  "3ds",
  ".cue":  "ps1",  ".img":  "ps1",  ".chd": "ps1",
  ".iso":  "ps2",
  ".cso":  "psp",  ".pbp":  "psp",
  ".gdi":  "dreamcast", ".cdi": "dreamcast",
  ".zip":  "arcade", ".rom":  "arcade",
  ".7z":   "arcade",
  ".a26":  "atari2600",
  ".a52":  "atari5200",
  ".lnx":  "lynx",
  ".pce":  "pcengine",
  ".ngp":  "ngp",  ".ngc":  "ngp",
  ".ws":   "wonderswan", ".wsc": "wonderswan",
};

const FOLDER_TO_SYSTEM: Record<string, string> = {
  "nes": "nes", "famicom": "nes",
  "snes": "snes", "supernintendo": "snes",
  "n64": "n64", "nintendo64": "n64",
  "gb": "gb", "gameboy": "gb",
  "gbc": "gbc", "gameboycolor": "gbc",
  "gba": "gba", "gameboyadvance": "gba",
  "nds": "nds", "ds": "nds", "nintendods": "nds",
  "3ds": "3ds", "gamecube": "gamecube", "gc": "gamecube", "wii": "wii",
  "ps1": "ps1", "psx": "ps1", "playstation": "ps1",
  "ps2": "ps2", "playstation2": "ps2", "psp": "psp",
  "genesis": "genesis", "megadrive": "genesis",
  "mastersystem": "mastersystem", "sms": "mastersystem",
  "gamegear": "gamegear", "gg": "gamegear",
  "32x": "32x", "saturn": "saturn", "dreamcast": "dreamcast", "dc": "dreamcast",
  "atari2600": "atari2600", "2600": "atari2600",
  "atari5200": "atari5200", "5200": "atari5200",
  "atari7800": "atari7800", "7800": "atari7800",
  "lynx": "lynx", "neogeo": "neogeo", "neo": "neogeo",
  "ngp": "ngp", "neogeopocket": "ngp",
  "arcade": "arcade", "mame": "arcade", "fba": "arcade", "fbneo": "arcade",
  "pcengine": "pcengine", "tg16": "pcengine", "turbografx": "pcengine",
  "wonderswan": "wonderswan", "ws": "wonderswan",
  "c64": "c64", "commodore64": "c64", "amiga": "amiga", "dos": "dos",
  "pc88": "pc88", "scummvm": "scummvm",
};

const ROM_EXTENSIONS = new Set(Object.keys(EXT_TO_SYSTEM));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScannerStatus {
  enabled: boolean;
  watchDir: string | null;
  watchPaths: string[];
  lastScanAt: number | null;
  lastScanFound: number;
  totalScanned: number;
  watching: boolean;
  error: string | null;
  pathStats: Record<string, { found: number; imported: number; lastScanAt: number | null; error: string | null }>;
}

type AddRomsBulkFn = (roms: any[]) => Promise<void>;
type ListFilenamesFn = () => Promise<string[]>;
type GetNasPathsFn = () => Promise<string[]>;

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000;
const MAX_DEPTH = 10; 

let _addRomsBulk: AddRomsBulkFn | null = null;
let _listFilenames: ListFilenamesFn | null = null;
let _getNasPaths: GetNasPathsFn | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _envPaths: string[] = [];
let _isScanning = false;

let _status: ScannerStatus = {
  enabled:       false,
  watchDir:      null,
  watchPaths:    [],
  lastScanAt:    null,
  lastScanFound: 0,
  totalScanned:  0,
  watching:      false,
  error:         null,
  pathStats:     {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normaliseFolder(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inferSystem(filePath: string, rootPath: string): string {
  const relative = path.relative(rootPath, filePath);
  const parts = relative.split(path.sep);
  for (let i = parts.length - 2; i >= 0; i--) {
    const key = normaliseFolder(parts[i]);
    if (FOLDER_TO_SYSTEM[key]) return FOLDER_TO_SYSTEM[key];
  }
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TO_SYSTEM[ext] ?? "arcade";
}

/** Async recursive ROM collection */
async function collectRomFilesAsync(dir: string, depth = 0): Promise<string[]> {
  if (depth > MAX_DEPTH) return [];
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await collectRomFilesAsync(fullPath, depth + 1)));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ROM_EXTENSIONS.has(ext)) results.push(fullPath);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Scanner] Unable to read directory ${dir}: ${msg}`);
  }
  return results;
}

async function scanPath(
  rootPath: string,
  existingNames: Set<string>,
): Promise<any[]> {
  const newRoms: any[] = [];
  
  if (!fsSync.existsSync(rootPath)) {
    _status.pathStats[rootPath] = { found: 0, imported: 0, lastScanAt: Date.now(), error: `Path not found: ${rootPath}` };
    return newRoms;
  }

  console.log(`[Scanner] Scanning ${rootPath}`);
  const romFiles = await collectRomFilesAsync(rootPath);

  for (const filePath of romFiles) {
    const fileName = path.basename(filePath);
    if (existingNames.has(fileName)) continue;

    const ext      = path.extname(fileName).toLowerCase();
    const system   = inferSystem(filePath, rootPath);
    const baseName = path.basename(fileName, ext);
    const title    = baseName.replace(/[_\-.]+/g, " ").trim();
    const slug =
      baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
      + "-" + Date.now().toString(36)
      + Math.random().toString(36).slice(2, 5);

    try {
      const stat = await fs.stat(filePath);
      newRoms.push({
        title, system, slug,
        originalName: fileName,
        fileName,
        filePath,
        size: stat.size,
        mimeType: "application/octet-stream",
        createdAt: Date.now(),
      });
      existingNames.add(fileName);
    } catch {
      // skip individual errors
    }
  }

  _status.pathStats[rootPath] = { found: romFiles.length, imported: newRoms.length, lastScanAt: Date.now(), error: null };
  console.log(`[Scanner] ${rootPath}: ${romFiles.length} ROM file(s), ${newRoms.length} new import(s).`);
  return newRoms;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main scan loop
// ─────────────────────────────────────────────────────────────────────────────

async function doScan(): Promise<void> {
  if (_isScanning || !_addRomsBulk || !_listFilenames) return;
  _isScanning = true;

  try {
    const nasPaths = _getNasPaths ? (await _getNasPaths().catch(() => [])) : [];
    const allPaths = Array.from(new Set([..._envPaths, ...nasPaths].filter(Boolean)));

    if (allPaths.length === 0) {
      _status.watchPaths = [];
      _status.watchDir = null;
      _isScanning = false;
      return;
    }

    console.log(`[Scanner] Watch paths: ${allPaths.join(", ")}`);
    _status.watchPaths = allPaths;
    _status.watchDir   = allPaths.join(", ");
    _status.enabled    = true;
    _status.watching   = true;

    const existingNames = new Set(await _listFilenames());
    let allNewRoms: any[] = [];

    for (const p of allPaths) {
      const newRoms = await scanPath(p, existingNames);
      allNewRoms.push(...newRoms);
    }

    if (allNewRoms.length > 0) {
      console.log(`[Scanner] Found ${allNewRoms.length} new ROM(s). Inserting...`);
      await _addRomsBulk(allNewRoms);
      console.log(`[Scanner] Successfully imported ${allNewRoms.length} games.`);
    }

    _status.lastScanAt    = Date.now();
    _status.lastScanFound = allNewRoms.length;
    _status.totalScanned += allNewRoms.length;
    _status.error         = null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    _status.error = msg;
    console.error("[Scanner] scan error:", msg);
  } finally {
    _isScanning = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function initScanner(
  watchDir: string,
  addRomsBulk: AddRomsBulkFn,
  listFilenames: ListFilenamesFn,
  getNasPaths?: GetNasPathsFn,
): () => Promise<void> {
  _addRomsBulk   = addRomsBulk;
  _listFilenames = listFilenames;
  _getNasPaths   = getNasPaths ?? null;

  _envPaths = watchDir.split(",").map((p) => p.trim()).filter(Boolean);

  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(doScan, POLL_INTERVAL_MS);

  // Background the initial scan so boot isn't blocked
  void doScan();
  return doScan;
}

export function refreshNasPaths(getNasPaths: GetNasPathsFn): void {
  _getNasPaths = getNasPaths;
}

export function scanNow(): Promise<void> {
  return doScan();
}

export function getStatus(): ScannerStatus {
  return { ..._status, pathStats: { ..._status.pathStats } };
}

export interface DetectedFolder {
  folderName: string;
  fullPath: string;
  platformId: string | null;
  detectionMethod: "exact" | "alias" | "manual" | null;
  fileCount: number;
  sampleFiles: string[];
}

export function detectPlatformFolders(rootPath: string): DetectedFolder[] {
  const results: DetectedFolder[] = [];
  try {
    const topLevel = fsSync.readdirSync(rootPath, { withFileTypes: true });
    for (const entry of topLevel) {
      if (!entry.isDirectory()) continue;
      const folderPath = path.join(rootPath, entry.name);
      const key = normaliseFolder(entry.name);
      const platformId = FOLDER_TO_SYSTEM[key] ?? null;

      let files: string[] = [];
      try {
        files = fsSync.readdirSync(folderPath)
          .filter((f) => ROM_EXTENSIONS.has(path.extname(f).toLowerCase()));
      } catch { /* skip */ }

      results.push({
        folderName: entry.name,
        fullPath: folderPath,
        platformId,
        detectionMethod: platformId ? (FOLDER_TO_SYSTEM[entry.name.toLowerCase()] ? "exact" : "alias") : null,
        fileCount: files.length,
        sampleFiles: files.slice(0, 5),
      });
    }
  } catch { /* ignore */ }
  return results;
}
