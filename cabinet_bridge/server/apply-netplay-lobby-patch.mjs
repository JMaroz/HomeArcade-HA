#!/usr/bin/env node
/**
 * apply-netplay-lobby-patch.mjs
 *
 * Wires up the Netplay lobby UI:
 *   1. routes.ts    — import listOpenRooms, GET /api/netplay/rooms
 *   2. GameDetailDialog.tsx — Wifi icon, NetplayLobbyDialog import,
 *                             netplayOpen state, Netplay button
 *
 * Run once from cabinet_bridge/:
 *   node server/apply-netplay-lobby-patch.mjs
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
// 1. routes.ts
// ═══════════════════════════════════════════════════════════════════════════
const routesPath = resolve(root, "server/routes.ts");

// 1a: Add listOpenRooms import (after storage import, same pattern as scanner)
{
  let src = readFileSync(routesPath, "utf8");
  if (src.includes("listOpenRooms")) {
    console.log("⏭  routes.ts listOpenRooms import already present.");
  } else {
    const updated = src.replace(
      /^(import \{ storage \} from ['\"]\.\/.+?['\"]);/m,
      `$1\nimport { listOpenRooms } from './netplay';`,
    );
    if (updated === src) {
      console.error("✗  routes.ts listOpenRooms import — storage import line not found, skipping.");
    } else {
      writeFileSync(routesPath, updated, "utf8");
      console.log("✓  routes.ts listOpenRooms import added.");
    }
  }
}

// 1b: Add GET /api/netplay/rooms endpoint
applyPatch(
  "routes.ts GET /api/netplay/rooms",
  routesPath,
  `  app.put("/api/collections/:id/roms/:romId", async (req, res) => {`,
  `  // ── Netplay lobby ─────────────────────────────────────────────────────────────────
  app.get("/api/netplay/rooms", (_req, res) => {
    res.json(listOpenRooms());
  });

  app.put("/api/collections/:id/roms/:romId", async (req, res) => {`,
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. GameDetailDialog.tsx
// ═══════════════════════════════════════════════════════════════════════════
const dialogPath = resolve(root, "client/src/components/GameDetailDialog.tsx");

// 2a: Add Wifi to lucide-react imports
applyPatch(
  "GameDetailDialog.tsx Wifi icon import",
  dialogPath,
  `Database, Check } from "lucide-react";`,
  `Database, Check, Wifi } from "lucide-react";`,
);

// 2b: Add NetplayLobbyDialog import after the @shared/schema import
applyPatch(
  "GameDetailDialog.tsx NetplayLobbyDialog import",
  dialogPath,
  `import type { GameCollectionWithItems, UploadedRom, RomSaveSlot, GameCheatCode } from "@shared/schema";`,
  `import type { GameCollectionWithItems, UploadedRom, RomSaveSlot, GameCheatCode } from "@shared/schema";
import { NetplayLobbyDialog } from "@/components/NetplayLobbyDialog";`,
);

// 2c: Add netplayOpen state after selectedRomId state
applyPatch(
  "GameDetailDialog.tsx netplayOpen state",
  dialogPath,
  `  const [selectedRomId, setSelectedRomId] = useState<number | null>(null);`,
  `  const [selectedRomId, setSelectedRomId] = useState<number | null>(null);
  const [netplayOpen, setNetplayOpen] = useState(false);`,
);

// 2d: Add Netplay button + NetplayLobbyDialog after the Close button in the action row
applyPatch(
  "GameDetailDialog.tsx Netplay button",
  dialogPath,
  `              <Button size="lg" variant="ghost" onClick={onClose} data-testid="button-detail-close">
                Close
              </Button>
            </div>`,
  `              <Button size="lg" variant="ghost" onClick={onClose} data-testid="button-detail-close">
                Close
              </Button>
              {game.romId && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setNetplayOpen(true)}
                  id="cabinet-netplay-open"
                  data-testid="button-detail-netplay"
                >
                  <Wifi className="size-4" /> Netplay
                </Button>
              )}
            </div>
            {netplayOpen && game.romId && (
              <NetplayLobbyDialog
                game={game}
                profileId={profileId}
                onClose={() => setNetplayOpen(false)}
              />
            )}`,
);

console.log("\n✅  Netplay lobby patch complete.");
console.log("   Rebuild / restart dev server to activate.");
