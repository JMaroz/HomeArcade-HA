import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const ROMS_BASE = "C:\\RetroBat\\roms";
const DB_PATH = "token-repo/cabinet_bridge/data.db";
const STORAGE_PATH = "token-repo/cabinet_bridge/rom-storage";

// Expanded system map
const SYSTEM_MAP = {
  "sega32x": "sega32x",
  "saturn": "saturn",
  "dreamcast": "dreamcast",
  "gba": "gba",
  "gbc": "gbc",
  "gb": "gb"
};

const EXTENSIONS = [".nes", ".smc", ".sfc", ".bin", ".md", ".gba", ".gb", ".gbc", ".z64", ".n64", ".iso", ".chd", ".zip", ".7z", ".cdi", ".gdi"];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log("Starting RetroBat import (Part 2)...");

  if (!fs.existsSync(DB_PATH)) {
    console.error("Database not found at " + DB_PATH);
    return;
  }

  const db = new Database(DB_PATH);
  const insertStmt = db.prepare(`
    INSERT INTO uploaded_roms (
      title, system, slug, original_name, file_name, file_path, size, mime_type, created_at, scrape_status, favorite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalImported = 0;

  for (const [batDir, haSystem] of Object.entries(SYSTEM_MAP)) {
    const fullPath = path.join(ROMS_BASE, batDir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${batDir} - path not found`);
      continue;
    }

    console.log(`Scanning ${batDir}...`);
    const files = fs.readdirSync(fullPath)
      .filter(f => EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .slice(0, 5);

    if (files.length === 0) {
      console.log(`  No matching files found in ${batDir}`);
      continue;
    }

    const haSystemPath = path.join(STORAGE_PATH, haSystem);
    fs.mkdirSync(haSystemPath, { recursive: true });

    for (const file of files) {
      const src = path.join(fullPath, file);
      const dest = path.join(haSystemPath, file);
      const stats = fs.statSync(src);

      try {
        if (!fs.existsSync(dest)) {
          try {
            fs.linkSync(src, dest);
          } catch {
            fs.copyFileSync(src, dest);
          }
        }

        const cleanTitle = path.parse(file).name.replace(/\(.*\)|\[.*\]/g, "").trim();
        const slug = slugify(cleanTitle + "-" + haSystem + "-" + Math.random().toString(36).slice(2, 5));
        
        const existing = db.prepare("SELECT id FROM uploaded_roms WHERE file_name = ? AND system = ?")
          .get(file, haSystem);

        if (!existing) {
          insertStmt.run(
            cleanTitle,
            haSystem,
            slug,
            file,
            file,
            dest,
            stats.size,
            "application/octet-stream",
            Date.now(),
            "not_scraped",
            0
          );
          totalImported++;
          console.log(`  Imported: ${cleanTitle}`);
        }
      } catch (err) {
        console.error(`  Failed to import ${file}:`, err.message);
      }
    }
  }

  console.log(`\nSuccess! Imported ${totalImported} games.`);
  db.close();
}

run();
