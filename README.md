# HomeArcade

> The premium retro gaming frontend for Home Assistant.

HomeArcade is a powerful Home Assistant Add-on that turns your sidebar into a full retro gaming hub. Manage ROMs, browse systems with rich metadata, launch games in a high-performance in-browser emulator, and sync with your local PC via RetroBat integration.

**Current version: 2.12.0** · [Report a bug](https://github.com/GlerschNersch/token/issues/new) · [View source](https://github.com/GlerschNersch/token)

[![Venmo](https://img.shields.io/badge/Venmo-@vincusmalincus-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/vincusmalincus)

![HomeArcade library view showing Browse Systems, Favorites shelf, and the HA sidebar panel](docs/screenshots/homearcade-library.png)

---

## Quick start

**1. Add the repository**

In Home Assistant: **Settings → Apps → Add-ons → ⋮ → Repositories**, paste:
```
https://github.com/GlerschNersch/token
```

**2. Install and start**

Find **HomeArcade** in the store, click **Install**, wait for the build to finish (2–5 minutes), then click **Start**. Enable **Show in sidebar**.

**3. Upload a ROM and play**

Open HomeArcade from the sidebar, click a system (e.g. NES), drop a ROM file onto the upload zone, then click the game card → **Play**.

That's it. No port forwarding, no reverse proxy, no extra software.

---

## Supported systems

Systems are listed in release-date order.

| System | Core | Accepted formats |
|---|---|---|
| Arcade (MAME) | mame2003 | `.zip` |
| Atari 2600 | stella2014 | `.a26` `.bin` `.zip` |
| NES | nes | `.nes` `.zip` |
| Atari 7800 | prosystem | `.a78` `.bin` `.zip` |
| Sega Master System | smsgg | `.sms` `.zip` |
| TurboGrafx-16 / PC Engine | pce | `.pce` `.zip` |
| Genesis / Mega Drive | segaMD | `.md` `.bin` `.smd` `.zip` |
| Game Boy | gambatte | `.gb` `.zip` |
| Atari Lynx | mednafen_lynx | `.lnx` `.zip` |
| Game Gear | smsgg | `.gg` `.zip` |
| Neo Geo | fbneo | `.zip` |
| SNES | snes9x | `.smc` `.sfc` `.zip` |
| Sega CD | segaCD | `.cue+.bin` `.iso` `.chd` `.zip` |
| Sega 32X | picodrive | `.32x` `.bin` `.zip` |
| Saturn | yabause | `.iso` `.bin` `.zip` |
| PlayStation 1 | pcsx | `.cue+.bin` `.iso` `.pbp` `.chd` `.zip` |
| Virtual Boy | beetle_vb | `.vb` `.zip` |
| Nintendo 64 | mupen64plus | `.n64` `.z64` `.v64` `.zip` |
| Game Boy Color | gambatte | `.gbc` `.zip` |
| Dreamcast | reicast | `.cdi` `.gdi` `.chd` `.zip` |
| PlayStation 2 | pcsx2 | `.iso` `.bin` `.zip` |
| Game Boy Advance | mgba | `.gba` `.zip` |
| Nintendo DS | melonds | `.nds` `.zip` |
| PSP | ppsspp | `.iso` `.cso` `.pbp` `.zip` |

---

## Changelog

### v2.12.1
- **Theme Cleanup** — Removed Slate and gameOS themes to focus on fully mobile-optimized layouts.
- **Mobile Refinement** — Improved responsiveness across all remaining dashboard styles.

### v2.12.0
- **Theme Expansion** — Added Alekfull NX (Switch Style) and Art Book Next (Magazine) themes.
- **Enhanced OS Simulation** — Added real-time status bar to Alekfull theme.

### v2.11.0
- **Theme Expansion** — Added two new high-end dashboard layouts:
  - **Alekfull NX** — A clean, Switch-inspired dashboard with a horizontal system carousel and master-detail game view.
  - **Art Book Next** — A minimalist, magazine-style layout focusing on large artwork and asymmetric design.
- **Enhanced OS Simulation** — Added a real-time system status bar (Clock, WiFi, Battery) to the Alekfull theme.

### v2.11.0
- **Colorful Theme** — Added a high-vibrancy, bold dashboard layout inspired by Anthony Caccese's "Colorful" series.
- **Giant Tile Navigation** — Massive vertical box art and system-matched background gradients.

### v2.10.2
- **PlayHub Visibility Fix** — Corrected a bug that hid the game info panel on desktop screens.
- **Dynamic Fanart Backgrounds** — PlayHub now features full-screen, cross-fading game art as you browse the grid.
- **Improved Art Scaling** — Re-engineered box art fitting to prevent squashed images in PlayHub.

### v2.10.1
- **Theme Cleanup** — Removed the Horizon Ribbon theme to streamline the experience.
- **Slate Theme Integration** — Fully operational Slate theme for power users.

### v2.10.0
- **Slate Theme** — Added a new professional, high-density layout inspired by EmulationStation Desktop Edition.
- **Improved List Navigation** — Smooth vertical scrolling and metadata panels for power users.

### v2.3.4
- **Rebranding** — Finalized transition from "Cabinet Bridge" to **HomeArcade** across all UI and documentation.
- **Global Localization** — Updated all translation files to reflect the new HomeArcade branding.
- **Premium Frontend Engine** — Rebuilt from the ground up with Vite + React + Tailwind v4.
- **Dashboard** — New central landing page with recently played, stats, and activity feed.
- **Advanced Integration** — Direct integration with RetroBat and Home Assistant webhooks for PC control.
- **Smart Filters** — Create dynamic collections using complex rules (genre, rating, year, etc.).
- **Netplay Lobby** — Built-in lobby for multiplayer sessions.
- **Enhanced Performance** — Optimized server bundle and client assets for faster load times.

### v2.3.3
- **Premium Frontend Engine** — Rebuilt from the ground up with Vite + React + Tailwind v4.
- **Dashboard** — New central landing page with recently played, stats, and activity feed.
- **Advanced Integration** — Direct integration with RetroBat and Home Assistant webhooks for PC control.
- **Smart Filters** — Create dynamic collections using complex rules (genre, rating, year, etc.).
- **Netplay Lobby** — Built-in lobby for multiplayer sessions.
- **Enhanced Performance** — Optimized server bundle and client assets for faster load times.

### v0.7.38
- Bump version to trigger Home Assistant update

### v0.7.37
- **Netplay lobby UI** — Create or join rooms via the library header; view active rooms and join with a code

### v0.7.36
- **ROM scanner** — Auto-import ROMs from a watched folder on the host

### v0.7.35
- **Smart filter collections** — Dynamic game lists based on rules (system, genre, etc.)

### v0.7.34
- **Appearance settings** — New theme picker in Settings

### v0.7.33
- **Play status & Live timer** — Status badges on cards and real-time playtime updates

### v0.6.0
- **TheGamesDB scraper** — new primary metadata source (box art, descriptions, genre, developer, publisher); add your free API key in Settings → Services. Falls through to ScreenScraper then Libretro thumbnails if unmatched
- **Play History page** — dedicated `/history` route showing all sessions grouped by day with per-game playtime bars, total playtime stat, and most-played game summary
- **Per-profile favorites, ratings, and play status** — non-default profiles maintain their own favorites, star ratings, and backlog/playing/completed status independently of the global library
- **Per-profile key bindings** — Settings → Controls now has a profile selector; each profile stores its own keyboard overrides on top of global defaults, loaded at game launch
- **Mobile landscape mode** — on-screen pad compresses correctly in landscape orientation; button press feedback animation on touch devices
- **Touch responsiveness** — `touch-action: manipulation` on game cards eliminates the 300 ms tap delay on iOS/Android; scroll containers use `overscroll-contain` for native feel

### v0.5.3
- ROM upload progress bar with per-file and overall percentage using `XMLHttpRequest`

### v0.5.2 (hotfix)
- Fixed `Unexpected token 'var'` crash caused by regex backslash consumption inside TypeScript template literals; replaced with `indexOf`/`slice` URL derivation

### v0.5.1
- Fixed netplay relay URL derivation behind HA Ingress prefix

### v0.5.0
- **Named player profiles** — create profiles in Settings → Player Profiles; switch from the library header; save states, cheats, and key remaps are isolated per profile
- **Cheat codes panel** — full slide-in panel to add, toggle, and delete cheat codes per game per profile
- **Three new shader presets** — Scanlines, LCD (pixel-perfect), Phosphor (green glow)
- **Netplay** — WebSocket relay server; create or join a room code to play with a friend

### v0.4.12
- **Named player profiles** — create profiles in Settings → Player profiles; switch from the library header; save states, cheats, and key remaps are isolated per profile
- **Cheat codes panel** — full slide-in panel to add, toggle, and delete cheat codes per game per profile (replaces non-functional stub)
- **Three new shader presets** — Scanlines (scanline overlay), LCD (pixel-perfect high-contrast), Phosphor (green monochrome glow)

### v0.4.12
- Display settings (aspect ratio and filters) now reliably override EmulatorJS canvas styles via CSS `!important`

### v0.4.11
- Systems sidebar sorted by console release date

### v0.4.10 – v0.4.8
- Fixed Express 5 wildcard route crash
- Fixed games stuck at 0% (Content-Length / gzip mismatch)
- Fixed template literal syntax error in bootstrap JS

---

## Links

- [Report a bug](https://github.com/GlerschNersch/token/issues/new)
- [EmulatorJS](https://emulatorjs.org)
- [RetroAchievements](https://retroachievements.org)
- [ScreenScraper](https://www.screenscraper.fr)

## Support

If HomeArcade has been useful to you, a small tip is always appreciated but never expected!

[![Venmo](https://img.shields.io/badge/Venmo-@vincusmalincus-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/vincusmalincus)
