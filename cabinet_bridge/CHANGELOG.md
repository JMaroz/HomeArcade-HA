## 2.42.12 – 2026-05-23

- **Fix**: **ROM Range Download Path** — Fixed the Range-response branch in `/api/roms/:id/file` that was using a forward-slash–normalized string path instead of the OS-native path for `fsSync.createReadStream`. On Windows, streaming a ROM with a forward-slash path returns empty content, causing games to fail to load with a silent black screen.

## 2.42.0 – 2026-05-23

- **Stabilization**: **Foundation Finalized** — Verified all build manifests and synchronized versions across the new repository for definitive Home Assistant deployment.

## 2.40.0 – 2026-05-23

- **Major**: **Pure Libretro Foundation Finalized** — Resolved the conflicting security headers that were preventing the RetroArch Web engine from initializing.
- **Release**: **Changelog Sync** — Synchronized the Home Assistant add-on changelog with the latest development history.

## 2.34.120 – 2026-05-23

- **Fix**: **RetroArch CDN Fallback** — Implemented a fallback mechanism that automatically loads engine assets from the official Libretro CDN if local assets are missing.
- **Fix**: **Mandatory Cross-Origin Isolation** — Enforced strict `COOP` and `COEP` headers on the server to resolve MIME type and script execution errors in modern browsers.
- **Improved**: **Engine Boot Sequence** — Refined the `Module` initialization to correctly handle asynchronous WebAssembly loading and virtual filesystem mounting.

## 2.34.119 – 2026-05-23

- **Major**: **Pure Libretro Migration** — Transitioned from the EmulatorJS wrapper to the official RetroArch Web (WASM) engine for professional-grade stability and advanced feature support.
- **Feature**: **Official RetroArch Menu** — Re-enabled the classic RGUI interface for full control over shaders, cheats, and core settings directly in-browser.

## 2.34.118 – 2026-05-23

- **Fix**: **Client-Side Path Resolution** — Migrated 100% of the asset routing logic to the browser, eliminating "Unexpected token '<'" errors by ensuring absolute Ingress URLs are always used.
- **Improved**: **Asset Loader Sync** — Re-aligned the initialization sequence to ensure all configuration flags are set before the engine boots.

## 2.34.117 – 2026-05-23

- **Major**: **Fresh Asset Implementation** — Overhauled emulator engine asset management by moving all files into the static `public` directory for reliable bundling and serving.

## 2.34.116 – 2026-05-22

- **Fix**: **Asset Routing** — Implemented robust Ingress path detection to ensure all emulator assets are requested using verified absolute paths.

## 2.34.115 – 2026-05-22

- **Fix**: **90% Loading Hang** — Corrected absolute pathing errors and reverted all core identifiers to their most compatible standard aliases (`nes`, `snes`, `gba`, `segaMD`, `fba`).

## 2.34.114 – 2026-05-22

- **Fix**: **Loading Restored** — Resolved a major regression where all systems failed to load by implementing dynamic `ingressBase` detection.

## 2.34.113 – 2026-05-22

- **Fix**: **System-Wide Mobile Compatibility** — Switched to stable core identifiers and absolute paths to ensure reliable playback on phones and tablets.

## 2.34.112 – 2026-05-22

- **Major**: **Definitive Core Realignment** — Restored standard system identifiers for all consoles to ensure perfect compatibility with the EmulatorJS WASM catalog.

## 2.34.111 – 2026-05-22

- **Fix**: **N64 Core Stability** — Fine-tuned the N64 configuration for perfect playback and added specific health checks to prevent regressions.

## 2.34.110 – 2026-05-22

- **Feature**: **Automated Core Health Checks** — Introduced a new test suite (`core-health.test.ts`) that verifies every system's core mapping and BIOS requirements before release.

## 2.34.109 – 2026-05-22

- **Fix**: **Conditional Sega BIOS** — Standard Genesis and Master System games now correctly bypass BIOS requirements, while Sega CD titles correctly retain the prompt.

## 2.34.108 – 2026-05-22

- **Fix**: **Ultra-Aggressive UI Hiding** — Implemented multi-layered CSS and JS overrides to permanently resolve the "2 sets of buttons" issue.

## 2.34.107 – 2026-05-22

- **Fix**: **Game Boy & GBC Loading** — Restored core mapping to standard aliases (`gb`, `gbc`) to resolve loading hangs.

## 2.34.106 – 2026-05-22

- **Fix**: **NES & Arcade Loading** — Updated core mapping to use specific Libretro identifiers to match the CDN WASM catalog.

## 2.34.105 – 2026-05-22

- **Fix**: **90% Loading Hang** — Reverted core naming to standard system aliases to ensure correct asset discovery.

## 2.34.104 – 2026-05-22

- **Fix**: **Audio Engine Crash** — Resolved a critical `TypeError` during startup by adding a default volume guard for the OpenAL audio driver.

## 2.34.103 – 2026-05-22

- **Fix**: **Console Errors (403 / Content-Length)** — Explicitly exposed required headers to allow the emulator to download large assets through the HA proxy.

## 2.34.102 – 2026-05-22

- **Fix**: **N64 Loading Failure** — Reverted N64 core to system alias for maximum cross-device compatibility.

## 2.34.101 – 2026-05-22

- **Fix**: **Gamepad Input Bridge** — Implemented a manual input relay that bypasses browser-specific Gamepad API quirks for perfect controller reliability.

## 2.34.100 – 2026-05-22

- **Feature**: **Auto-Gamepad Detection** — The app now automatically detects when controllers are connected and applies standardized Retropad mapping.

## 2.34.99 – 2026-05-22

- **Feature**: **Netplay Diagnostic Engine** — Added server-side logging to track peer connections and message routing for debugging synchronization.

## 2.34.98 – 2026-05-22

- **Performance**: **Payload Trimming** — Optimized the ROMs API to omit null fields, reducing JSON size by ~40% for faster dashboard loading.

## 2.34.97 – 2026-05-22

- **Improved**: **PS1/PS2 Performance** — Optimized asset pre-fetching and core initialization to improve load times.
- **Fix**: **Menu Freeze** — Resolved an issue where the in-game menu would freeze the emulator state.

## 2.34.96 – 2026-05-22

- **Feature**: **Customizable Touch Controls** — Added real-time sliders for button size and opacity.
- **Feature**: **HD Mode (Upscale)** — Introduced an "HD Mode" toggle for internal upscaling on supported cores.

## 2.34.95 – 2026-05-22

- **Major**: **Lemuroid-Style Menu Overhaul** — Redesigned the in-game menu with a centered glass card and large action tiles.
- **Improved**: **Forced UI Hiding** — More aggressive overrides to ensure the default EmulatorJS menu stays hidden.

## 2.34.94 – 2026-05-22

- **Fix**: **Netplay Synchronization** — Explicitly enabled the internal netplay engine flag to ensure joined sessions correctly sync game state.

## 2.34.93 – 2026-05-22

- **Fix**: **PS1/PS2 Startup Hang** — Corrected core naming mismatch to ensure BIOS files are detected correctly.

## 2.34.92 – 2026-05-22

- **Fix**: **Double Virtual Controls** — Force-disabled internal mobile detection and added CSS overrides to resolve button overlap.
- **Aesthetics**: **High-Gloss UI** — Applied 3D bulb highlights and authentic concave/convex button geometry.

## 2.34.91 – 2026-05-22

- **Major**: **Netplay Pro Lobby** — Overhauled the Netplay lobby with a high-fidelity UI and live status indicators.
- **Stable**: **WebRTC STUN Servers** — Integrated Google STUN servers for better P2P connectivity and lower lag.

## 2.34.90 – 2026-05-22

- **Fix**: **Button Overlap** — Resolved a bug where default buttons rendered under the custom skin.

## 2.34.88 – 2026-05-22

- **Feature**: **Auto-Resume ("Pick Up and Play")** — The app now automatically quick-saves on exit and quick-loads on launch.
- **Engine**: **High-Performance Cores** — Upgraded default cores to modern versions (mgba, snes9x, fceumm).

## 2.34.40 – 2026-05-21

- **Fix**: **Netplay Synchronization** — Fixed a bug where netplay rooms would connect but game sessions wouldn't sync. The EmulatorJS bootstrap now correctly receives `EJS_netplayUrl`, `EJS_netplayRole`, and `EJS_netplayRoom` variables.
- **Improved**: **Dynamic Netplay URL** — Added automatic WebSocket protocol detection (ws/wss) to ensure netplay works behind Home Assistant Ingress without manual configuration.

## 2.34.39 – 2026-05-21

- **Fix**: **HA Ingress Routing** — Moved ingress prefix stripping to the top of the middleware stack to fix routing issues for streaming Server-Sent Events (SSE).
- **UX**: **Scrape All Feedback** — Added a "All ROMs already scraped" notification to provide better feedback when clicking Scrape All on a completed library.

## 2.34.38 – 2026-05-21

- **Fix**: **Bulk Scrape Progress Bar** — Disabled response buffering for the scrape-all route by adding `X-Accel-Buffering: no`. This allows the real-time progress bar to appear in the UI when running behind Home Assistant.
- **Cleanup**: **Repository Hygiene** — Added `art-cache` to `.gitignore` to prevent local image cache from being committed.

## 2.34.37 – 2026-05-21

- **Fix**: **Broken Game Art in HA** — Fixed an issue where game thumbnails and background fanart failed to load in Home Assistant. All proxy image sources now correctly use the `apiUrl()` helper to prepend the ingress prefix.
- **Dev**: **Windows Compatibility** — Integrated `cross-env` into package scripts to allow the dev server (`npm run dev`) start correctly on Windows machines.

## 2.34.36 – 2026-05-21

- **Fix**: **Art Proxy in Theme** — Updated the HomeArcade theme to route all box art and fanart through the server-side proxy, fixing CORS issues for ScreenScraper and Libretro assets.

## 2.34.35 – 2026-05-21

- **UX**: **Simplified Dashboard** — Removed the "Jump Back In" and redundant "Recently Played" strips from the home page for a cleaner, faster-loading interface.
- **UX**: **Mobile Nav Cleanup** — Removed the "History" link from the mobile bottom navigation bar and optimized spacing for the remaining items.

## 2.34.34 – 2026-05-21

- **Feature**: **Simplified Controls** — Removed the complex manual visual remapper in favor of a cleaner, more reliable controls settings interface.

## 2.34.3 – 2026-05-20

- **Fix**: **QR Scanner Stability** — Fixed a re-render loop in the WarpScanner component that caused the camera to flicker and fail on some devices. Added secure context (HTTPS) validation and better error feedback when camera access is denied.
- **UI**: **Removed All Themes** — Removed all legacy UI themes (PXL, NES, etc.) and locked the application to the core "HomeArcade" dark aesthetic for a consistent and polished experience.
- **Cleanup**: **Codebase Optimization** — Deleted unused theme components and simplified global CSS by removing hundreds of lines of theme-specific variables and overrides.

## 2.24.56 – 2026-05-19

- **Feature**: **New Retro Console Icons** — Replaced Wikimedia Commons hardware photos with high-quality, transparent PNG illustrations from the `KyleBing/retro-game-console-icons` repository. Provides a much cleaner and more cohesive look for the system tiles.
- **Improved**: **System Image Proxy** — Updated the backend to support both PNG and JPEG images for system tiles, ensuring transparency is preserved for the new icons.

## 2.24.43 – 2026-05-18

- **Fix**: **TV-friendly responsive grid** — Replaced fixed `grid-cols-N` column counts with `repeat(auto-fill, minmax(180px, 1fr))` for the games grid and `repeat(auto-fill, minmax(140px, 1fr))` for the systems grid. Shows fewer, larger cards on large displays; readable font sizes on all screens.
- **Fix**: **package.json version field** — `"2.24.42"` was missing its key name (`"version":`), causing Docker builds to fail with `EJSONPARSE`. Fixed and verified with `npm run build`.

## 2.24.39 – 2026-05-18

- **Feature**: **Visual Controller Remapper** — New interactive remapping UI with an SVG gamepad diagram showing the Xbox controller layout (A/B/X/Y face buttons, D-pad, bumpers, sticks, triggers). Click any action then press a physical button to bind it. Shows human-readable labels (`A`, `B`, `X`, `Y`, `LB`, `RB`, etc.) instead of generic system labels (`BTN 0`, `BTN 1`). Supports live button press detection.

## 2.24.37 – 2026-05-18

- **UX**: **Recently Played — collapsible, below Browse Systems** — Moved Recently Played below the Browse Systems grid and made it collapsible via a toggle header with chevron icon.
- **UX**: **Settings icon visible on mobile** — Fixed settings icon on mobile top bar so it always renders in `text-primary` regardless of active route.

## 2.24.33 – 2026-05-18

- **Feature**: **Dashboard unified — Library merged into Dashboard** — The Dashboard (`/`) is now the primary game browsing surface. Includes: real-time fuzzy search (Fuse.js, searches title/system/genre/developer/publisher), sort bar (Recent / Title / Year / Rating / Plays), Recently Played horizontal strip, Browse Systems grid (click filters by system), and a unified All Games grid. Library page (`/library`) is deprecated and redirects to `/`.
- **Fix**: **Keyboard shortcuts** — Added `/` and `Ctrl+K` global shortcuts to focus the search bar; `Escape` clears search and blurs the input.

## 2.24.32 – 2026-05-18

- **UX**: **Library page deprecated** — `/library`, `/library/:filter`, `/library/collection/:id` now redirect to Dashboard (`/`). The separate Library page will be merged into the Dashboard in a future update.

- **UX**: **Full-width layout** — Removed the sidebar from the app shell. All navigation now routes through the top bar (Dashboard, Library, Activity) and the Dashboard's system tabs. The sidebar nav was redundant with the Browse Systems grid.
- **UX**: **System tabs — color + count** — Each dashboard system tab now shows a color swatch matching the system's gradient, and a game count badge. Active tab uses the system gradient as its background.

## 2.24.27 – 2026-05-18

- **Feature**: **Comprehensive Playwright UX Test Suite** — Added `e2e/ux.spec.ts` covering sidebar navigation, game library interactions, search/sort/filter, game detail dialogs, settings, keyboard navigation, mobile responsive, and edge cases.

- **Fix**: **Exit Game Button** — Fixed a bug where the "Exit Game" button in the emulator menu was non-functional. It now correctly returns you to the library.

## 2.24.9 – 2026-05-17

- **Fix**: **Warp Link Database Error** — Resolved the "no such column: rom_hash" error that prevented save-state syncing during Warp sessions.

## 2.24.8 – 2026-05-17

- **Feature**: **Warp to Mobile (Pre-launch)** — Added the ability to generate a Warp QR code directly from the game detail dialog and dashboard.
- **Feature**: **Automatic Save-State Warping** — Warp links now automatically include the latest save state if available, allowing for seamless session hand-offs.
- **Improved**: **Warp UI** — New instructions and visual feedback during Warp Link generation.

## 2.3.0 – 2026-05-16

- **Performance**: **EmulatorJS CDN disk cache** — EJS core assets (`.wasm`, `.js`, `.data`) are now cached to `data/ejs_cache/` on first load and served from local disk on all subsequent requests, eliminating repeated internet fetches for multi-MB cores.
- **Performance**: **ROM range streaming** — the `/api/roms/:id/file` endpoint now handles `Range:` requests, allowing the browser to stream only the bytes it needs rather than buffering the entire ROM before emulation starts.
- **Performance**: **`Accept-Ranges` + `immutable` cache on EJS assets** — browser skips conditional requests for cached core files entirely.
- **Performance**: **Bootstrap script caching** — `bootstrap.js` now carries a `private, max-age=300` header; identical ROM+profile combos are served from browser cache.
- **Performance**: **Player shell caching** — the emulator player HTML is now cached for 60 seconds to avoid re-serving the full shell on every visit.

## 1.1.14 – 2026-05-15

- **Major**: **Full Localization Support** — Replaced all hardcoded English strings with dynamic translation keys across the entire application.
- **Improved**: **Multi-language Synchronization** — All 7 supported languages (EN, ES, FR, DE, PT, JA, ZH) are now 100% synchronized and up-to-date.
- **Improved**: **Settings UI** — Every label and hint in the Settings page is now fully translatable.
- **Improved**: **Dashboard & Home** — Localized all stats, headers, and UI elements.

## 1.1.13 – 2026-05-15

- **Improved**: **Performance** — Applied priority rendering flags to game cards in the Dashboard shelves and Home page "Jump Back In" sections for faster above-the-fold loading.

## 1.1.12 – 2026-05-15

- **Improved**: **Performance** — Implemented Intersection Observer for library game cards to reduce memory/CPU load.
- **Improved**: **Load Speed** — Added fetch priority and eager loading for the first 10 items in any grid.
- **Improved**: **Polling** — Reduced frequency of background API calls when the app is idle or hidden.
- **Improved**: **Touch UX** — Disabled video previews on touch devices and added scroll restoration for smoother navigation.

## 1.1.11 – 2026-05-15

- **Feature**: **Theme Visual Polish** — Added unique aesthetics (Win95 bevels, Gameboy dot-matrix, Synthwave glows, Arcade scanlines) to specific themes.

## 1.1.10 – 2026-05-15

- **Fix**: **UI Themes** — Updated CSS selectors to `.dark[data-theme="..."]` to ensure they have higher specificity and correctly override default dark mode variables.
- **Improved**: **Theme Application** — Theme changes now apply instantly and reliably across the entire interface.

## 1.1.9 – 2026-05-15

- **Fix**: **Emulator Bootstrap** — Resolved "bootstrap.js blocked" error by correctly passing global display settings (aspect ratio, shader) to the emulator loader script.
- **Fix**: **Variable Scope** — Resolved a ReferenceError that prevented the dynamic generation of the emulator loading sequence.

## 1.1.8 – 2026-05-15

- **Feature**: **18 UI Themes** — Implemented full CSS definitions for 18 diverse aesthetics including Synthwave, Gameboy, OLED, Cyberpunk, and Win95.
- **Improved**: **Performance** — Removed unused adaptive background CSS to streamline the main stylesheet and improve rendering speed.

## 1.1.7 – 2026-05-15

- **Fix**: **Dashboard Crash** — Resolved a white screen crash caused by a missing `useIntegration` import in the Dashboard component.

## 1.1.6 – 2026-05-15

- **Fix**: **Logic Restoration** — Restored essential library management code in `Home.tsx` that was accidentally omitted during the display settings refactor.
- **Fix**: **Dependency Isolation** — Broke a circular dependency between Settings and App modules by moving theme definitions to `lib/themes.ts`.

## 1.1.5 – 2026-05-15

- **Feature**: **Per-System Overrides** — Users can now set custom Aspect Ratios, Shaders, and Integer Scaling for each gaming system individually.
- **Feature**: **Global Preferences** — Added global fallback settings for aspect ratio and shaders in Settings → Display.
- **Feature**: **System Labels Toggle** — Added an option to hide console names on game cards across the entire UI for a cleaner look.
- **Fix**: **Translation Sync** — Changing the language in Settings now immediately updates the UI without requiring a manual refresh.

## 1.1.4 – 2026-05-14

- **Feature**: **Official System Logos** — Replaced hardware photos with official branding logos on all system tiles for much clearer navigation. Logos are automatically fetched and cached from Libretro assets.
- **Improved**: **System Tiles** — Redesigned tiles to overlay branding logos on top of hardware photos (when available), creating a premium, high-contrast look.

## 1.1.3 – 2026-05-14

- **New**: **Bulk Scrape** — Added a "Scrape All" button in Settings → Services to refresh metadata and art for all unscraped or failed ROMs.
- **Fix**: **Settings UI Restored** — Fixed a regression where the Services and Kiosk tabs were missing from the Settings menu.
- **Fix**: **Build Stability** — Resolved multiple TypeScript errors and missing dependency issues to ensure a healthy production build.

## 1.1.2 – 2026-05-14

- **Fix**: Art Scraping — Resolved a ReferenceError in the Libretro fallback that caused art scraping to fail for many titles.
- **Fix**: Cheat Retrieval — Restored the missing `/api/roms/:id/fetch-cheats` route, allowing the UI to pull codes from the Libretro database.
- **Fix**: Cheat Toggling — Fixed a bug where enabling/disabling a cheat code would fail due to an incorrect database method name.
- **Fix**: API Consistency — Updated the scrape response format to match frontend expectations for immediate UI updates.

## 1.1.1 – 2026-05-14

- **Fix**: Corrected automatic art scraping and RetroAchievements settings lookup. Fixed a bug where incorrect field names were used to retrieve service credentials, which prevented automatic art fetching during upload and RA progress tracking.

## 1.1.0 – 2026-05-14

- **Modular Architecture**: Retired the 5,500-line monolithic `server/routes.ts` in favour of 13 specialized route modules under `server/routes/`. This significantly improves maintainability and developer velocity.
- **Enhanced Data Integration**: Refactored the `gamelist.xml` parser (supporting EmulationStation and LaunchBox formats) to extract enriched metadata, including star ratings, play counts, and last-played timestamps.
- **Improved Test Isolation**: Implemented lazy database initialization and per-test data directory logic, achieving 100% passing tests with zero shared-state pollution.
- **Multi-Architecture Support**: Updated `Dockerfile` to support both AMD64 and ARM64 (aarch64) base images automatically.
- **Bug Fix**: Restored missing `/api/kiosk` public configuration route.
- **Bug Fix**: Resolved gamepad binding leak between Player 1 and Player 2.

## 0.7.38 – 2026-05-13

- Feature: **Internationalization (i18n)** – language switcher added to Settings → Display; supports English, Español, Français, Deutsch, Português, 日本語, and 中文 (Simplified); selection is persisted server-side via IntegrationConfig and applied instantly across the UI via react-i18next; locale JSON files live in `client/src/locales/`

## 0.7.37 – 2026-05-11

- Feature: **Netplay lobby UI** — "Netplay" button (id=`cabinet-netplay-open`) in the game detail dialog action row; opens a lobby showing all open rooms on this server (5s poll); host creates a new 6-char room code with one click; join by code input or by clicking any listed room; hosting view displays the code prominently with copy button and pulses when a friend joins; player launches automatically as host or client; run `node server/apply-netplay-lobby-patch.mjs` once from `cabinet_bridge/` to activate
- API: `GET /api/netplay/rooms` — returns open (waiting) rooms as `{ code, createdAt }[]`

## 0.7.36 – 2026-05-11

- Feature: **ROM scanner** — set `CABINET_ROM_WATCH_DIR` in the HA add-on environment to auto-import ROM files dropped into a folder; polls every 60 seconds; system detected from extension (nes/snes/genesis/n64/gb/gbc/gba/nds/ps1/ps2/psp/dreamcast/arcade); Settings → Library shows watch dir, last scan time, total imported, and a "Scan now" button; run `node server/apply-scanner-patch.mjs` once from `cabinet_bridge/` to activate
- API: `GET /api/scanner/status`, `POST /api/scanner/scan-now`

## 0.7.35 – 2026-05-11

- Feature: **Smart filter collections** — dynamic collections that auto-populate from rules; create in Settings → Library with system pill toggles, play status filters, min rating, min playtime, genre keyword, and favorites-only switch; stored as JSON in `game_collections.smart_filter`; re-evaluated live on every `listCollections()` call; run `node server/apply-smart-filter-patch.mjs` once from `cabinet_bridge/` to activate
- API: `POST /api/collections/smart` (create), `PATCH /api/collections/:id/smart` (update rules)

## 0.7.34 – 2026-05-11

- Feature: **Appearance tab in Settings** — dedicated Settings → Appearance tab with 18 themes grouped by era (Base / 80s / 90s / Early 2000s); each card shows a tri-colour swatch and "Active" badge; theme moves out of General to its own tab; run `node server/apply-settings-appearance-patch.mjs` once from `cabinet_bridge/` to activate

## 0.7.33 – 2026-05-11

- Feature: **Play status badge on game cards** — colored dot next to system name: amber = Playing, green = Beaten, purple = Completed; hidden when status is Unset
- Feature: **Live play timer** — fixed pill in the top-right corner of the emulator overlay ticks mm:ss (then h:mm:ss) from the moment the game boots; run `node server/apply-overlay-patches.mjs` once from `cabinet_bridge/` to activate
- Feature: **Sync timestamp on save panel** — ☁ Sync button now shows "Last synced: Xm ago" next to it, persisted across sessions via localStorage; same patch script above
- Test: expanded `routes.test.ts` — coverage for P1/P2 controls port routing, gamepadRumble, systemDisplay schema validation, profile creation

## [0.7.0] – 2026-05-08

### Changed
- **Material Design 3 full overhaul** — complete alignment to the MD3 design system (m3.material.io) while preserving the dark gaming aesthetic
- **Color system** — MD3 color roles: primary/secondary/tertiary containers, surface container levels (lowest → highest), on-container text roles; dark theme uses tonal elevation overlays (primary-tinted surfaces)
- **Shape scale** — MD3 shape scale: extra-small 4px · small 8px · medium 12px (new default radius) · large 16px · extra-large 28px; all cards, dialogs, and chips updated
- **Type scale** — full MD3 type scale tokens (Display, Headline, Title, Body, Label with correct sizes, weights, and letter-spacing);  utility classes available
- **State layers** — replaced box-shadow elevation with MD3 state layers (): 8% hover, 12% press/focus, 16% drag; tinted to current-color for correct on-surface contrast
- **Navigation Drawer** — sidebar rebuilt to MD3 Navigation Drawer: active items use a 56 × pill-shaped primary-container indicator, section headers use Label Small, icon tinted to primary when active
- **Navigation Bar** — mobile bottom nav rebuilt to MD3 Navigation Bar: active tab has indicator pill under icon (primary-container), Label Small style, active icon tinted primary
- **Game Cards** — updated to MD3 Elevated Card: 16px large shape (rounded-xl), tonal surface (surface-container), Level-1 shadow, state layer on hover/press, borderless elevated style
- **Favorite button** — MD3 Tonal Icon Button: primary-container fill when active, rounded-full shape
- **Tailwind config** — Tailwind border-radius overrides updated to MD3 scale; new color tokens: , , , , 
