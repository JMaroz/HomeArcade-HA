# Cabinet Bridge — Project Handoff

A polished, RetroBat-inspired retro gaming frontend built to be embedded inside Home Assistant as an iframe panel. Ships as a webapp prototype with realistic sample data, procedural cover art, simulated PC controls, and an integration settings panel that maps directly to HA webhooks.

---

## Project Path

`/home/user/workspace/cabinet-bridge`

Built from `/home/user/workspace/skills/website-building/webapp/template`. Vite + React + Tailwind + shadcn/ui. No backend logic added — the template's Express server only serves the SPA.

---

## Commands Run

| Step | Command | Result |
| --- | --- | --- |
| Install | `npm install` | 454 packages, ~54s |
| Type check | `npx tsc --noEmit -p tsconfig.json` | Exits clean |
| Dev server | `npm run dev` (port 5000) | Currently running, pid 1140, log at `/tmp/cabinet-bridge.log` |
| Production build | `npm run build` | Built in 4.72s — `dist/public/index.html` + 79 kB CSS + 347 kB JS (112 kB gzipped) + `dist/index.cjs` (791 kB server bundle) |
| QA | Playwright at 390×844, 1024×1366, 1440×900, 1920×1080 | Passes — no console errors |

To start the production server (parent agent will handle this for deploy):

```bash
NODE_ENV=production node dist/index.cjs   # listens on port 5000
```

---

## Key Files

### Theme & shell

- `client/index.html` — title `Cabinet Bridge — Retro frontend for Home Assistant`, inline SVG favicon (CRT cabinet), preconnect + load for Inter and JetBrains Mono only
- `client/src/index.css` — retro arcade palette in `H S% L%` format: deep ink bg `240 14% 6%`, magenta primary `322 92% 60%`, cyan accent `188 90% 52%`, amber `35 95% 60%`. Adds `.crt` scanlines class, `.neon-text` / `.neon-cyan` / `.ring-neon` utilities, and a strong `:focus-visible` ring (cyan, 3px, offset 2px) for TV/keyboard navigation
- `tailwind.config.ts` — `font-display: 'JetBrains Mono'`, `font-sans: 'Inter'`, `bg-arcade-gradient`, status color tokens
- `client/src/App.tsx` — wraps `IntegrationProvider`, forces dark mode, manages `arcadeMode` (CRT toggle) state, hash routing with `/` and `/settings`

### Data & integration

- `client/src/data/library.ts` — 9 systems (NES, SNES, N64, GBA, Genesis, PS1, PS2, Arcade, Dreamcast), 18 games each with 3 HSL gradient stops (no images), 6 quick actions (`wake_pc`, `launch_retrobat`, `arcade_mode`, `sleep_pc`, `restart_pc`, `shutdown_pc`). `gameLaunchEndpoint(g)` returns `/api/webhook/cabinet_launch_<slug>`
- `client/src/lib/integration.tsx` — `IntegrationProvider` exposes `config` (HA base URL, token, live mode, endpoint overrides), `pc` state machine (`online`/`sleeping`/`offline`/`starting`), activity `log`, and `dispatch(actionId, payload)`. Live mode does real `fetch()` POST to the configured webhook; otherwise simulates with a 320ms delay. PC state mutates per action (e.g. `wake_pc` → `starting` → `online` after 1.5s)

### Components

- `client/src/components/Logo.tsx` — inline SVG cabinet mark + wordmark with mono caption `HOME ASSISTANT ⇄ RETROBAT`
- `client/src/components/GameArt.tsx` — `<GameArt>` renders procedural covers from 3 HSL stops + a hash-selected geometric overlay (CircleStack / DiagonalBars / PixelGrid). `<SystemTile>` shows monogram (`NES`, `SFC`, etc.) at top-center over a pixel grid. Zero binary image assets.
- `client/src/components/Sidebar.tsx` — Library group (Favorites / Recent / All Games), Systems group, Settings link, PC status pill at the bottom. `alwaysVisible` prop reused by mobile sheet.
- `client/src/components/MobileNav.tsx` — top bar with shadcn `Sheet` drawer
- `client/src/components/GameCard.tsx` — `aspect-3/4` art, favorite heart top-right, hover Launch overlay (neon cyan ring), meta footer
- `client/src/components/GameDetailDialog.tsx` — shadcn `Dialog` with art panel, metadata, HA webhook URL display, Launch / Favorite / Close buttons
- `client/src/components/RightPanel.tsx` — `xl:flex` only. PC info (hostname, IP, CPU/RAM meters), quick action grid, CRT Scanlines toggle, activity log (latest 40 entries with status badges: Queued / 200 OK / Error / Sim)

### Pages

- `client/src/pages/Home.tsx` — sidebar + main content + right panel. Continue Hero (when on Favorites with PC online), Browse Systems strip, Recently Played strip, main grid with sort menu (Recent / A-Z / Year / Rating), search input, empty state
- `client/src/pages/Settings.tsx` — Connection (HA base URL, token, Live mode switch with warning banner), endpoint overrides with copy buttons, sample game launch endpoint table, 5-step Wiring Guide with code blocks (Wake-on-LAN script, webhook automation, `panel_iframe` config), Reset button

### `data-testid` coverage

All interactive and dynamic elements: `nav-favorites`, `nav-recent`, `nav-all`, `nav-system-{id}`, `card-game-{id}`, `button-fav-{id}`, `button-launch-{id}`, `input-search`, `button-sort-{id}`, `tile-system-{id}`, `button-action-{id}` (`wake_pc`, `sleep_pc`, etc.), `button-toggle-crt`, `link-settings`, `link-back`, `input-ha-base`, `input-ha-token`, `switch-live-mode`, `input-endpoint-{id}`, `button-copy-{id}`, plus more.

---

## Design & Content Decisions

- **Palette inferred from subject** — retro cabinet UI for a darkened gaming room. Deep ink bg, magenta primary, cyan accent, amber chart-3. Dark-first (no light mode toggle — TV/cabinet UI).
- **Typography** — Inter body, JetBrains Mono for labels, eyebrows, status, and code. Caps-tracked uppercase mono on section eyebrows and PC stats for arcade/CRT feel.
- **No persistence by design** — all state is React. Settings reset on reload because the iframe sandbox blocks `localStorage` / `sessionStorage` / `indexedDB` / cookies. A comment in `integration.tsx` notes that real installs would persist credentials in HA itself, not in the panel.
- **Arcade Mode = CRT scanlines** — toggle adds `.crt` class to `<body>`, layering a repeating scanline gradient + radial vignette via fixed pseudo-elements. No layout shift.
- **Procedural cover art** — every game cover is generated from three HSL stops + a hash-selected geometric overlay. Zero binary image assets, no external image dependency.
- **Strong keyboard / controller focus** — global `:focus-visible` ring is 3px cyan with 2px offset and a soft glow; fully visible from couch distance. Tab order matches reading order; the Sidebar nav, game cards, and quick action buttons are all keyboard-reachable.
- **Hash routing** — `useHashLocation` wraps `<Router>` so the panel works inside a sandboxed iframe with no path-rewriting.
- **Realistic sample data** — 9 systems, 18 titles spanning NES through Dreamcast, with year, rating, last-played, favorited flag.

---

## Embedding in Home Assistant

After the parent agent deploys and you have a public URL, add this to `configuration.yaml`:

```yaml
panel_iframe:
  cabinet_bridge:
    title: Cabinet
    icon: mdi:gamepad-variant
    url: https://your-deploy-url.example
    require_admin: false
```

Restart HA. A "Cabinet" item appears in the sidebar that loads Cabinet Bridge in an iframe. The same snippet is shown verbatim inside the in-app Settings → Wiring Guide → Step 5.

---

## Wiring Webhooks (Live Mode)

1. Open the deployed Cabinet Bridge → **Settings**
2. Enter your HA base URL (e.g. `https://homeassistant.local:8123`) and a long-lived access token
3. Toggle **Live mode** on (warning banner appears — CORS must be allowed on the HA reverse proxy for the host serving Cabinet Bridge)
4. Optionally override the endpoint slug per quick action — defaults are listed below
5. In HA, create a webhook automation per action

### Default webhook endpoints

| Action | Endpoint |
| --- | --- |
| Wake PC (WoL) | `POST {ha_base}/api/webhook/cabinet_wake_pc` |
| Launch RetroBat | `POST {ha_base}/api/webhook/cabinet_start_retrobat` |
| Arcade Mode | `POST {ha_base}/api/webhook/cabinet_arcade_mode` |
| Sleep PC | `POST {ha_base}/api/webhook/cabinet_sleep_pc` |
| Restart PC | `POST {ha_base}/api/webhook/cabinet_restart_pc` |
| Shutdown PC | `POST {ha_base}/api/webhook/cabinet_shutdown_pc` |
| Launch a game | `POST {ha_base}/api/webhook/cabinet_launch_<game-slug>` (e.g. `cabinet_launch_super-mario-world`) |

### Example HA automation (Wake-on-LAN)

```yaml
- alias: Cabinet — Wake PC
  trigger:
    - platform: webhook
      webhook_id: cabinet_wake_pc
      allowed_methods: [POST]
      local_only: false
  action:
    - service: wake_on_lan.send_magic_packet
      data:
        mac: AA:BB:CC:DD:EE:FF
```

### Example HA automation (Launch a game on the cabinet PC)

```yaml
- alias: Cabinet — Launch Super Mario World
  trigger:
    - platform: webhook
      webhook_id: cabinet_launch_super-mario-world
      allowed_methods: [POST]
  action:
    - service: shell_command.retrobat_launch
      data:
        system: snes
        rom: super-mario-world.sfc
```

The full guide with the exact YAML snippets is included inside the app at **Settings → Wiring Guide**.

---

## Caveats

1. **No persistence** — credentials and settings reset on every reload. By design (sandboxed iframe blocks all storage). Real installs should persist HA credentials in HA itself, not in the Cabinet Bridge panel.
2. **Live mode requires CORS** — your HA reverse proxy must allow the host serving Cabinet Bridge. Off by default; the simulated mode is fully functional for demo / QA.
3. **Procedural cover art only** — to use real box art, replace `<GameArt>` in `GameCard.tsx` and `GameDetailDialog.tsx` with an `<img>` tag and add an `artUrl` field to the `Game` type in `library.ts`.
4. **Sample data is hardcoded** — 18 titles. A real install would fetch from RetroBat's `gamelist.xml` (one per system) at runtime via a small backend route or a CORS-allowed static file.
5. **PC status meters are simulated** — the right panel CPU/RAM bars animate with random walks. To reflect real values, expose a HA sensor and poll `/api/states/sensor.cabinet_pc_cpu` from `integration.tsx`.
6. **Don't deploy from this subagent** — parent agent will deploy. Build output already at `dist/public/` (static) + `dist/index.cjs` (server).

---

## QA Screenshots

Saved at `/home/user/workspace/screenshots/`:

- `final-tv.png` (1920×1080), `final-desktop.png` (1440×900), `final-tablet.png` (1024×1366), `final-mobile.png` (390×844)
- `dialog-real.png`, `crt-on.png`, `settings.png`, `mobile-nav.png`, `focus-state.png`, `all-games-2.png`, `search-mario.png`, `wake-clicked.png`

All viewports verified, no console errors, dialogs / search / CRT toggle / keyboard focus / quick actions all work.
