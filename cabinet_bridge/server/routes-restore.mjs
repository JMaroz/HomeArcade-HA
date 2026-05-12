#!/usr/bin/env node
/**
 * routes-restore.mjs
 *
 * Reassembles server/routes.ts from compressed chunks when it has been
 * accidentally truncated (the file should export registerRoutes).
 *
 * Called automatically from the Dockerfile before `npm run build`.
 * Safe to run multiple times — skips if routes.ts already looks healthy.
 */
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createWriteStream } from 'fs';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = path.join(__dirname, 'routes.ts');
const CHUNKS_DIR  = path.join(__dirname, 'routes-chunks');

// Only restore if registerRoutes export is missing
if (existsSync(ROUTES_PATH)) {
  const content = readFileSync(ROUTES_PATH, 'utf8');
  if (content.includes('export async function registerRoutes')) {
    console.log('[routes-restore] routes.ts is healthy — nothing to do.');
    process.exit(0);
  }
}

console.log('[routes-restore] routes.ts is broken — restoring from chunks...');

const chunkFiles = [];
for (let i = 0; ; i++) {
  const p = path.join(CHUNKS_DIR, `routes-chunk-${String(i).padStart(2, '0')}.txt`);
  if (!existsSync(p)) break;
  chunkFiles.push(p);
}

if (chunkFiles.length === 0) {
  console.error('[routes-restore] ERROR: no chunk files found in', CHUNKS_DIR);
  process.exit(1);
}

console.log(`[routes-restore] Reassembling from ${chunkFiles.length} chunks...`);
const b64 = chunkFiles.map(p => readFileSync(p, 'utf8')).join('');
const compressed = Buffer.from(b64, 'base64');

await pipeline(
  Readable.from(compressed),
  createGunzip(),
  createWriteStream(ROUTES_PATH)
);

console.log('[routes-restore] routes.ts restored successfully.');
