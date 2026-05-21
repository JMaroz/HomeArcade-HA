import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const ROMS_BASE = "C:\\RetroBat\\roms";
const DB_PATH = "token-repo/cabinet_bridge/data.db";
const STORAGE_PATH = "token-repo/cabinet_bridge/rom-storage";

// Map RetroBat folder names to HomeArcade system IDs
const SYSTEM_MAP = {
  "nes": "nes",
  "snes": "snes",
  "megadrive": "genesis",
  "genesis": "genesis",
  "gba": "gba",
  "gb": "gb",
  "gbc": "gbc",
  "n64": "n64",
  "psx": "ps1",
  "ps2": "ps2",
  "gamegear": "gamegear",
  "mastersystem": "mastersystem",
  "atari2600": "atari2600",
  "psp": "psp",
  "nds": "nds"
};

const EXTENSIONS = [".nes", ".smc", ".sfc", ".bin", ".md", ".gba", ".gb", ".gbc", ".z64", ".n64", ".iso", ".chd", ".zip", ".7z"];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log("Starting RetroBat import...");

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
    if (!fs.existsSync(fullPath)) continue;

    console.log(`Scanning ${batDir}...`);
    const files = fs.readdirSync(fullPath)
      .filter(f => EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .slice(0, 5); // Import up to 5 per system for preview

    if (files.length === 0) continue;

    // Ensure system storage dir exists
    const haSystemPath = path.join(STORAGE_PATH, haSystem);
    fs.mkdirSync(haSystemPath, { recursive: true });

    for (const file of files) {
      const src = path.join(fullPath, file);
      const dest = path.join(haSystemPath, file);
      const stats = fs.statSync(src);

      try {
        if (!fs.existsSync(dest)) {
          // Link file to save space
          try {
            fs.linkSync(src, dest);
          } catch {
            fs.copyFileSync(src, dest);
          }
        }

        const cleanTitle = path.parse(file).name.replace(/\(.*\)|\[.*\]/g, "").trim();
        const slug = slugify(cleanTitle + "-" + haSystem + "-" + Math.random().toString(36).slice(2, 5));
        
        // Check if already in DB
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
