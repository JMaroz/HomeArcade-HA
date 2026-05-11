/**
 * scanner.ts
 *
 * ROM scanner — watches a directory for new ROM files and auto-imports them
 * into the database. Activated by setting CABINET_ROM_WATCH_DIR in the HA
 * add-on options or environment.
 *
 * Polls every 60 seconds. New files are inserted with system inferred from
 * extension; metadata scraping can be triggered afterwards via the normal
 * scrape pipeline.
 */

import fs from "fs";
import path from "path";

export interface ScannerStatus {
  enabled: boolean;
  watchDir: string | null;
  lastScanAt: number | null;
  lastScanFound: number;
  totalScanned: number;
  watching: boolean;
  error: string | null;
}

/** Maps lowercase file extension → system ID */
const EXT_TO_SYSTEM: Record<string, string> = {
  ".nes":  "nes",
  ".smc":  "snes",  ".sfc":  "snes",
  ".md":   "genesis", ".gen": "genesis",
  ".z64":  "n64",  ".n64":  "n64",  ".v64":  "n64",
  ".gb":   "gb",
  ".gbc":  "gbc",
  ".gba":  "gba",
  ".nds":  "nds",
  ".cue":  "ps1",  ".img":  "ps1",
  ".iso":  "ps2",
  ".cso":  "psp",  ".pbp":  "psp",
  ".gdi":  "dreamcast", ".cdi": "dreamcast",
  ".zip":  "arcade", ".rom":  "arcade",
};

const ROM_EXTENSIONS = new Set(Object.keys(EXT_TO_SYSTEM));

const POLL_INTERVAL_MS = 60_000;

let _status: ScannerStatus = {
  enabled: false,
  watchDir: null,
  lastScanAt: null,
  lastScanFound: 0,
  totalScanned: 0,
  watching: false,
  error: null,
};

type AddRomFn = (rom: {
  title: string; system: string; slug: string;
  originalName: string; fileName: string; filePath: string;
  size: number; mimeType: string; createdAt: number;
}) => Promise<unknown>;

type ListFilenamesFn = () => Promise<string[]>;

let _addRom: AddRomFn | null = null;
let _listFilenames: ListFilenamesFn | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;

async function doScan(): Promise<void> {
  const dir = _status.watchDir;
  if (!dir || !_addRom || !_listFilenames) return;

  try {
    if (!fs.existsSync(dir)) {
      _status.error = `Watch directory not found: ${dir}`;
      return;
    }

    const existingNames = new Set(await _listFilenames());
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let found = 0;

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ROM_EXTENSIONS.has(ext)) continue;
      if (existingNames.has(entry.name)) continue;

      const system   = EXT_TO_SYSTEM[ext] ?? "arcade";
      const filePath = path.join(dir, entry.name);
      const stat     = fs.statSync(filePath);
      const baseName = path.basename(entry.name, ext);
      const title    = baseName.replace(/[_\-\.]+/g, " ").trim();
      const slug     =
        baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)
        + "-" + Date.now().toString(36)
        + Math.random().toString(36).slice(2, 5);

      try {
        await _addRom({
          title, system, slug,
          originalName: entry.name,
          fileName: entry.name,
          filePath,
          size: stat.size,
          mimeType: "application/octet-stream",
          createdAt: Date.now(),
        });
        found++;
        _status.totalScanned++;
      } catch {
        // Likely a slug collision or constraint violation — skip silently.
      }
    }

    _status.lastScanAt    = Date.now();
    _status.lastScanFound = found;
    _status.error         = null;

    if (found > 0) {
      console.log(`[Scanner] Imported ${found} new ROM(s) from ${dir}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    _status.error = msg;
    console.error("[Scanner] scan error:", msg);
  }
}

/**
 * Start the scanner. Safe to call multiple times — clears the previous
 * interval before starting a new one.
 *
 * @returns The `doScan` function so callers can trigger an immediate scan.
 */
export function initScanner(
  watchDir: string,
  addRom: AddRomFn,
  listFilenames: ListFilenamesFn,
): () => Promise<void> {
  _addRom       = addRom;
  _listFilenames = listFilenames;
  _status.watchDir = watchDir;
  _status.enabled  = true;
  _status.watching = true;

  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(doScan, POLL_INTERVAL_MS);

  // First scan runs immediately (non-blocking).
  void doScan();

  return doScan;
}

/** Trigger an immediate scan outside the regular polling cycle. */
export function scanNow(): Promise<void> {
  return doScan();
}

/** Return a snapshot of the current scanner state. */
export function getStatus(): ScannerStatus {
  return { ..._status };
}
