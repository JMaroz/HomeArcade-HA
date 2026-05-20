# HomeArcade — Project Handoff

A premium retro gaming frontend built as a Home Assistant Add-on. Manages ROMs, scrapes metadata, launches games in an in-browser emulator, and supports Warp Link for seamless PC-to-mobile handoff.

---

## Project Path

`cabinet_bridge/` — the main add-on directory containing both the server and client.

---

## Stack

| Layer | Technology |
| :--- | :--- |
| Platform | Home Assistant Add-on (Docker, `aarch64` + `amd64`) |
| Server | Node.js + Express 5 |
| Database | SQLite via `better-sqlite3` + Drizzle ORM |
| Frontend | React 18 + Vite 7 + TypeScript 5.6 |
| Routing | Wouter (hash-based, iframe-safe) |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Animations | Framer Motion 11 |
| Data Fetching | TanStack React Query v5 |
| Icons | Lucide React |
| i18n | react-i18next |
| Emulator | EmulatorJS (loaded at runtime from `/emulatorjs/`) |

---

## Commands

| Step | Command |
| :--- | :--- |
| Dev server | `npm run dev` (port 5000) |
| Type check | `npx tsc --noEmit` |
| Build | `npm run build` |
| Start production | `NODE_ENV=production node dist/index.cjs` |
| DB migrations | `npx drizzle-kit push` |

---

## Key Directories

```
cabinet_bridge/
├── client/src/
│   ├── App.tsx                    # Root — SidebarProvider, ErrorBoundary, routing
│   ├── pages/
│   │   ├── Dashboard.tsx          # Theme switcher (HomeArcade / PXL / NES)
│   │   ├── Settings.tsx           # Settings shell (tabs → sub-components)
│   │   ├── settings/              # Settings sub-components
│   │   │   ├── DisplaySettings.tsx
│   │   │   ├── ControlsSettings.tsx
│   │   │   ├── LibrarySettings.tsx
│   │   │   ├── ServicesSettings.tsx
│   │   │   └── SettingsShared.tsx
│   │   ├── History.tsx
│   │   └── Achievements.tsx
│   ├── components/
│   │   ├── dashboard-themes/
│   │   │   ├── HomeArcadeTheme.tsx  # Default full-screen dark grid dashboard
│   │   │   ├── PxlTheme.tsx         # Retro Windows 95 style
│   │   │   └── NesTheme.tsx         # 8-bit NES style
│   │   ├── GameDetailDialog.tsx     # Unified game details modal
│   │   ├── GameDetailSubComponents.tsx  # Stat, HltbStat, SaveSlotCard, CheatRow
│   │   ├── Sidebar.tsx              # Full-featured sidebar (shadcn primitives)
│   │   ├── ErrorBoundary.tsx        # Global error boundary
│   │   ├── MobileNav.tsx            # MobileTopBar (used by themes on mobile)
│   │   └── ...
│   └── lib/
│       ├── integration.tsx          # IntegrationProvider — config, dispatch
│       ├── useGameDialogState.ts    # Shared game dialog state hook
│       ├── useGridNav.ts            # Keyboard/gamepad grid navigation
│       └── filter.ts                # Library filter types and route mapping
├── server/
│   ├── index.ts                     # Express server entry point
│   ├── routes/
│   │   ├── roms.ts                  # ROM upload, player, scraping, save states
│   │   ├── player.ts                # Emulator page + bootstrap JS templates
│   │   ├── profiles.ts              # User profiles
│   │   ├── collections.ts           # Game collections + smart filters
│   │   ├── cheats.ts                # Cheat code management
│   │   ├── retroachievements.ts     # RA API integration
│   │   ├── scrape.ts                # TheGamesDB + ScreenScraper
│   │   ├── bios.ts                  # BIOS file management
│   │   └── ...
│   └── storage.ts                   # Drizzle ORM database layer
└── config.yaml                      # Home Assistant add-on manifest
```

---

## Navigation Architecture

- **Dashboard (`/`)**: Renders `Dashboard.tsx` which selects the active theme (`HomeArcadeTheme`, `PxlTheme`, or `NesTheme`). These are full-screen fixed layouts with their own `MobileTopBar`. The `AppShell` (sidebar + `SidebarInset`) is **not** used here.
- **Secondary pages (`/settings`, `/history`, `/achievements`)**: Rendered inside `AppShell`, which wraps content in `SidebarProvider` + `Sidebar` + `SidebarInset`. On desktop the sidebar is persistent and collapsible; on mobile it becomes a slide-out Sheet triggered by a `SidebarTrigger` button.
- **Player (`/play/:id`)**: Full-screen emulator, also inside `AppShell`.

---

## Game Details

All game details are handled by the unified `GameDetailDialog` component (a shadcn `Dialog`). There is no standalone `/game/:id` page — navigating to `/game/:id` redirects to `/?game=id` which auto-opens the dialog.

---

## Embedding in Home Assistant

Add to `configuration.yaml`:

```yaml
panel_iframe:
  cabinet:
    title: "HomeArcade"
    icon: mdi:gamepad-variant
    url: "http://homeassistant.local:8123/api/hassio_ingress/<slug>"
```

Or install directly as an add-on from the repository: `https://github.com/GlerschNersch/token`

---

## Caveats

1. **Hash routing** — All routes use `#/` hash prefix so the app works inside a sandboxed HA iframe without path rewriting.
2. **Emulator isolation** — The emulator player page (`/api/roms/:id/player`) is a standalone HTML page served by the server, not a React route. It loads EmulatorJS from `/emulatorjs/` at runtime.
3. **No light mode** — The app is dark-first. Themes are applied via `data-theme` attribute on `<html>`.
4. **Version pinning** — Critical dependencies (`react`, `vite`, `drizzle-orm`, `express`, etc.) are pinned to exact versions to prevent surprise breakage during HA add-on builds.
