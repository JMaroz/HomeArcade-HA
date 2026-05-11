#!/usr/bin/env node
/**
 * apply-scanner-patch.mjs
 *
 * Wires up the ROM scanner:
 *   1. storage.ts  — addScannedRom() + listRomFilenames() in class + IStorage
 *   2. routes.ts   — scanner import, init, GET /api/scanner/status,
 *                    POST /api/scanner/scan-now
 *   3. Settings.tsx — ScannerStatusSection component in Library tab
 *
 * Run once from cabinet_bridge/:
 *   node server/apply-scanner-patch.mjs
 *
 * Order: run AFTER apply-smart-filter-patch.mjs (or independently — both
 * are idempotent and use non-overlapping anchors).
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function applyPatch(label, filePath, oldStr, newStr) {
  let src = readFileSync(filePath, "utf8");
  const check = newStr.trimStart().slice(0, 60);
  if (src.includes(check)) {
    console.log(`⏭  ${label} already applied.`);
    return;
  }
  if (!src.includes(oldStr)) {
    console.error(`✗  ${label} — anchor not found, skipping.`);
    return;
  }
  writeFileSync(filePath, src.replace(oldStr, newStr), "utf8");
  console.log(`✓  ${label}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. storage.ts
// ═══════════════════════════════════════════════════════════════════════════
const storagePath = resolve(root, "server/storage.ts");

// 1a: Add addScannedRom + listRomFilenames to IStorage interface
// Anchor: the listCollections() declaration in the interface (untouched by other patches)
applyPatch(
  "storage.ts IStorage scanner methods",
  storagePath,
  `  listCollections(): Promise<GameCollectionWithItems[]>;`,
  `  listCollections(): Promise<GameCollectionWithItems[]>;
  addScannedRom(rom: { title: string; system: string; slug: string; originalName: string; fileName: string; filePath: string; size: number; mimeType: string; createdAt: number }): Promise<UploadedRom>;
  listRomFilenames(): Promise<string[]>;`,
);

// 1b: Add addScannedRom + listRomFilenames to DatabaseStorage class
// Anchor: just before the export const storage singleton (end of class)
applyPatch(
  "storage.ts DatabaseStorage scanner methods",
  storagePath,
  `}\n\nexport const storage = new DatabaseStorage();`,
  `  async addScannedRom(rom: { title: string; system: string; slug: string; originalName: string; fileName: string; filePath: string; size: number; mimeType: string; createdAt: number }): Promise<UploadedRom> {
    return sqlite.prepare(
      "INSERT INTO uploaded_roms (title, system, slug, original_name, file_name, file_path, size, mime_type, created_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING *"
    ).get(rom.title, rom.system, rom.slug, rom.originalName, rom.fileName, rom.filePath, rom.size, rom.mimeType, rom.createdAt) as UploadedRom;
  }

  async listRomFilenames(): Promise<string[]> {
    return (sqlite.prepare("SELECT file_name FROM uploaded_roms").all() as { file_name: string }[]).map((r) => r.file_name);
  }
}

export const storage = new DatabaseStorage();`,
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. routes.ts
// ═══════════════════════════════════════════════════════════════════════════
const routesPath = resolve(root, "server/routes.ts");

// 2a: Add scanner import after the storage import line
{
  let src = readFileSync(routesPath, "utf8");
  if (src.includes("from './scanner'") || src.includes('from "./scanner"')) {
    console.log("⏭  routes.ts scanner import already present.");
  } else {
    const updated = src.replace(
      /^(import \{ storage \} from ['\"]\.\/.+?['\"]);/m,
      `$1\nimport * as scanner from './scanner';`,
    );
    if (updated === src) {
      console.error("✗  routes.ts scanner import — storage import line not found, skipping.");
    } else {
      writeFileSync(routesPath, updated, "utf8");
      console.log("✓  routes.ts scanner import added.");
    }
  }
}

// 2b: Add GET /api/scanner/status + POST /api/scanner/scan-now endpoints
// Anchor: just before the collections PUT endpoint (stable across other patches)
applyPatch(
  "routes.ts scanner endpoints",
  routesPath,
  `  app.put("/api/collections/:id/roms/:romId", async (req, res) => {`,
  `  // ── ROM scanner ──────────────────────────────────────────────────────────────────────\n  app.get("/api/scanner/status", (_req, res) => {
    res.json(scanner.getStatus());
  });

  app.post("/api/scanner/scan-now", async (_req, res) => {
    try {
      await scanner.scanNow();
      res.json({ ok: true, status: scanner.getStatus() });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  app.put("/api/collections/:id/roms/:romId", async (req, res) => {`,
);

// 2c: Init scanner before the httpServer return
applyPatch(
  "routes.ts scanner init",
  routesPath,
  `  return httpServer;`,
  `  // ── ROM scanner init ───────────────────────────────────────────────────────────\n  const CABINET_ROM_WATCH_DIR = process.env.CABINET_ROM_WATCH_DIR;
  if (CABINET_ROM_WATCH_DIR) {
    scanner.initScanner(
      CABINET_ROM_WATCH_DIR,
      (rom) => storage.addScannedRom(rom),
      ()    => storage.listRomFilenames(),
    );
    console.log(\`[Scanner] Watching \${CABINET_ROM_WATCH_DIR} for new ROMs (60s poll).\`);
  }

  return httpServer;`,
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. Settings.tsx
// ═══════════════════════════════════════════════════════════════════════════
const settingsPath = resolve(root, "client/src/pages/Settings.tsx");

// 3a: Add ScanLine to lucide-react imports
{
  let src = readFileSync(settingsPath, "utf8");
  if (src.includes("ScanLine")) {
    console.log("⏭  Settings.tsx ScanLine import already present.");
  } else {
    src = src.replace(/} from "lucide-react";/, `, ScanLine } from "lucide-react";`);
    writeFileSync(settingsPath, src, "utf8");
    console.log("✓  Settings.tsx ScanLine added to lucide-react imports.");
  }
}

// 3b: Insert <ScannerStatusSection /> in the Library tab,
//     just before the Metadata import section (same anchor used by smart-filter
//     patch; both are idempotent and insert their own unique component tag)
applyPatch(
  "Settings.tsx ScannerStatusSection usage",
  settingsPath,
  `              <Section title="Metadata import"`,
  `              <ScannerStatusSection />

              <Section title="Metadata import"`,
);

// 3c: Insert ScannerStatusSection component definition before Section helper
const SCANNER_COMPONENT = `
// ── ROM scanner status ────────────────────────────────────────────────────────

interface ScannerStatusData {
  enabled: boolean;
  watchDir: string | null;
  lastScanAt: number | null;
  lastScanFound: number;
  totalScanned: number;
  watching: boolean;
  error: string | null;
}

function ScannerStatusSection() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const { data: status } = useQuery<ScannerStatusData>({
    queryKey: ["/api/scanner/status"],
    refetchInterval: 30_000,
  });

  const handleScanNow = async () => {
    setScanning(true);
    try {
      await apiRequest("POST", "/api/scanner/scan-now");
      await queryClient.invalidateQueries({ queryKey: ["/api/scanner/status"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
      toast({ title: "Scan complete", description: \`Found \${status?.lastScanFound ?? 0} new ROM(s).\` });
    } catch (err) {
      toast({ title: "Scan failed", description: String(err), variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  if (!status?.enabled) {
    return (
      <Section title="ROM scanner"
        description="Auto-import ROMs dropped into a watched folder. Set CABINET_ROM_WATCH_DIR in your HA add-on environment to enable.">
        <p className="text-sm text-muted-foreground">
          Not active — set{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">CABINET_ROM_WATCH_DIR</code>{" "}
          in the add-on config to enable automatic ROM imports.
        </p>
      </Section>
    );
  }

  return (
    <Section title="ROM scanner"
      description="Auto-imports new ROM files found in the watched folder every 60 seconds.">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-mono">
          <span className="text-muted-foreground">Watch dir:</span>
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{status.watchDir}</code>
          {status.watching && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" /> Active
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground font-mono">
          <span>Total imported: <span className="text-foreground">{status.totalScanned}</span></span>
          {status.lastScanAt ? (
            <span>Last scan: <span className="text-foreground">{new Date(status.lastScanAt).toLocaleTimeString()}</span></span>
          ) : null}
          {(status.lastScanFound ?? 0) > 0 && (
            <span className="text-primary">+{status.lastScanFound} last run</span>
          )}
        </div>

        {status.error ? (
          <p className="text-xs text-destructive font-mono">{status.error}</p>
        ) : null}

        <Button variant="outline" size="sm" onClick={handleScanNow} disabled={scanning}
          className="gap-1.5" data-testid="button-scan-now">
          {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <ScanLine className="size-3.5" />}
          Scan now
        </Button>
      </div>
    </Section>
  );
}

`;

applyPatch(
  "Settings.tsx ScannerStatusSection component",
  settingsPath,
  `function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {`,
  SCANNER_COMPONENT + `function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {`,
);

console.log("\n✅  Scanner patch complete.");
console.log("   Rebuild / restart dev server to activate.");
console.log("   Set CABINET_ROM_WATCH_DIR env var to enable auto-import.");
