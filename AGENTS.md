# Repository Guidelines

## Package Manager
pnpm (not npm). Lockfile: `cabinet_bridge/pnpm-lock.yaml`. Install: `pnpm install`.

⚠️ **`pnpm-workspace.yaml` is missing `packages: ["."]`** — `pnpm install` fails with `packages field missing or empty` on pnpm 9.x unless you add it. The Docker build works because of `--no-frozen-lockfile`.

⚠️ **macOS port 5000** is used by AirPlay Receiver → `pnpm dev` gets EADDRINUSE. Use `PORT=5001 pnpm dev` to work around it.

## Commands (run from `cabinet_bridge/`)
| Command | What it does |
|---------|-------------|
| `pnpm dev` | Dev server (`tsx server/index.ts`, port 5000) |
| `pnpm build` | Vite builds client → `dist/public/`, esbuild bundles server → `dist/index.cjs` |
| `pnpm start` | Run production build (`NODE_ENV=production node dist/index.cjs`) |
| `pnpm check` | Type-check with `tsc` (noEmit). Excludes `**/*.test.ts` via tsconfig. |
| `pnpm test` | Vitest unit tests (happy-dom, 3 test dirs: `client/src/__tests__/`, `server/__tests__/`, `shared/__tests__/`) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:e2e` | Playwright tests (E2E server auto-started by config) |
| `pnpm db:push` | Push Drizzle ORM schema changes to SQLite |
| `pnpm bump` | Bump version. **Manually edit both** `package.json` **and** `config.yaml`. |

No dedicated lint script. TypeScript + tests are the quality gates.

## Architecture
- **Home Assistant add-on** served on port 5000 via Ingress proxy (`config.yaml` is the add-on manifest).
- **Stack**: React 18 + Vite 7 + Wouter (hash routing `#/`) + TanStack Query + Tailwind 3.4 + shadcn/ui on the client. Express 5 + better-sqlite3 + Drizzle ORM on the server.
- **Triple layout**: `client/src/` (React), `server/` (Express routes), `shared/` (DB schema + types). Tests in `__tests__/` per layer, E2E in `e2e/`.
- **Hash routing required** (`#/` prefix) so the app works inside a sandboxed HA iframe. Emulator player is a standalone HTML page served at `/api/roms/:id/player` — not a React route.
- **HA ingress prefix stripping** runs as the very first Express middleware in `server/index.ts:33`.
- **Version must stay in sync** between `package.json` and `config.yaml`.

## DB
SQLite via better-sqlite3 + Drizzle. Schema: `shared/schema.ts`. Migrations: `migrations/`. Run `pnpm db:push` after schema changes.

## Key Conventions
- ESM modules, 2-space indent, PascalCase components (`GameCard.tsx`), camelCase hooks (`useGridNav`).
- Critical deps pinned to exact versions (react, vite, drizzle-orm, express, framer-motion, wouter).
- Persistent state → `/data` at runtime; set `CABINET_DATA_DIR` locally to override.
- CI pipeline (root `.github/workflows/ci.yml`): `pnpm check` → `pnpm test` → Playwright chromium install → s6 dir lint → Docker build.
- Build & publish to `ghcr.io` for `amd64` + `aarch64` on push to main or semver tag.

## Reference Documents
- `HANDOFF.md` — detailed navigation architecture, routing, component tree.
- `cabinet_bridge/config.yaml` — HA add-on manifest (schema, version, ports).

## Commit Style
Short imperative subjects with prefixes: `fix:`, `feat:`, `chore:`, `bump:`, `test:`, `ui:`.

## Session State (last active: 2026-06-27)
- **Latest commit**: `5329133` — overhaul upload system (auto-detect, status/ETA/cancel, duplicates dialog, folder upload)
- **Upload system overhaul (4 phases)**:
  1. **Auto-detect**: `detectSystemFromContent()` with extension + magic-byte + folder-name detection; `POST /api/upload/detect` endpoint; client auto-selects with confidence badges
  2. **Enhanced status**: speed/ETA sliding window, per-file status table (pending/uploading/uploaded/failed/cancelled/skipped), Cancel All, error recovery (continues on per-file failure)
  3. **Duplicates**: `DuplicateDialog` (Keep Both / Replace / Skip per-file + apply-all), `POST /api/upload/check-duplicates`, `POST /api/roms/:id/replace`, storage `findRomBy*` + `updateUploadedRomFile`
  4. **Folder upload**: `webkitdirectory` support, folder→system detection, discGroup linking for multi-file (CUE/BIN) games
- **Prior**: Libretro-only art matcher (Feb 27), BIOS MD5 fix (Feb 27), ScreenScraper/TheGamesDB removed
- **Pre-existing failures**: `release-health.test.ts` (changelog not updated per release); `scale.test.ts` sort benchmark flake
- **Version**: 2.45.0 (not bumped — user chose to skip)
- **Pending**: Changelog entry for releases; bump version when ready
