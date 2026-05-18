# Changelog

All notable changes to HomeArcade are documented here.

---

## [2.24.18] — 2026-05-17

### Fix: Box Art & Cross-Origin Performance

- **Refined Security Context** — Switched to `credentialless` mode for the `Cross-Origin-Embedder-Policy`. This satisfies the emulator's requirement for `SharedArrayBuffer` (fixing the "Blocked by response" error) while allowing dashboard box art and external assets to load correctly.
- **Improved Navigation Isolation** — Updated `Cross-Origin-Opener-Policy` to `same-origin-allow-popups` for better compatibility with external links and redirects.

---

## [2.24.17] — 2026-05-17

### Fix: Security Header Blocking

- **COOP/COEP Isolation** — Added global `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers. This resolves the `ERR_BLOCKED_BY_RESPONSE` error when opening Warp Links on mobile devices by ensuring the browser provides the necessary security context for the emulator's `SharedArrayBuffer` usage.

---

## [2.24.16] — 2026-05-17

### Fix: Hardened Warp State Loading

- **Aggressive State Restoration** — Refactored the Warp handoff logic to try multiple restoration methods (`quickLoad` and `loadState`) and increased the initialization buffer to 3 seconds. This ensures games resume exactly where you left off on PC, providing a true "warp" experience across all emulator cores.

---

## [2.24.15] — 2026-05-17

### Performance: Optimized QR Scanner

- **High-Frequency Scanning** — Doubled the scanning frame rate (FPS) to 20, resulting in significantly faster and more responsive QR code detection when using Warp Link on mobile devices.
- **Improved Target Area** — Expanded the scanning viewport and guide area to provide a more forgiving target, making it easier to capture codes in various lighting conditions.

---

## [2.24.14] — 2026-05-17

### Fix: Warp QR 404 Error

- **Route Prioritization** — Fixed an issue where the `warp-qr` API endpoint was being incorrectly shadowed by the generic ROM detail route, causing 404 errors when generating Warp Links from the in-game menu.
- **Cleanup** — Removed redundant route registrations to improve server stability and performance.

---

## [2.24.13] — 2026-05-17

### Fix: SQL Fail-safe for rom_hash

- **Automatic Schema Recovery** — Added a low-level fail-safe that detects if the `rom_hash` column is missing and adds it manually during startup. This provides an absolute guarantee that the "no such column" error is resolved, even if migrations are blocked by filesystem permissions.
- **Improved Deployment Logic** — Refined the versioning and startup scripts to ensure all Home Assistant users receive the correct database structure immediately upon update.

---

## [2.24.12] — 2026-05-17

### Fix: Database Migration Reliability

- **Hardened Migration Path** — Fixed a critical issue where database migrations could fail to run depending on the execution environment. This ensures the `rom_hash` column is correctly added to the `rom_save_slots` table, resolving SQL errors during Warp Link operations.
- **Improved Boot Logging** — Updated the startup sequence to provide accurate version information in the Home Assistant logs.

---

## [2.24.11] — 2026-05-17

### Fix: Warp to Mobile Stability

- **Universal Handoff Point** — Standardized on Slot 9 as the primary handoff point for Warp Link, ensuring consistent behavior across all systems and preventing conflicts with Slot 0 auto-saves.
- **Warp QR Resolution** — Fixed a routing error that prevented QR codes from generating correctly when launched from the in-game menu.
- **Manual Warp Link** — Enabled a manual URL fallback in the Warp panel, ensuring the feature remains functional even if strict browser security policies block the QR image.
- **Smart Redirects** — Updated device handoff links to ensure users return to the HomeArcade dashboard instead of the Home Assistant root when exiting a game.

---

## [2.24.7] — 2026-05-17

### Stability: Warp Link Release Candidate

- **Finalized Warp Logic** — Consolidated recent stability fixes for Warp Link into a stable release candidate.
- **Universal Slot Compatibility** — Confirmed Slot 9 as the primary handoff point with Slot 0 fallback support for legacy cores.
- **Improved QR Resiliency** — Base64 QR delivery is now the default, ensuring functionality even behind restrictive Home Assistant ingress policies.

---

## [2.24.4] — 2026-05-17

### Fix: Warp Link Save Discovery

- **Robust Save Search** — Updated `cabinetBackupSlot` to search for save files in more locations, including core-specific auto-save paths. This ensures Warp Link works reliably across all cores, including NES and multi-disc systems.
- **Improved Feedback** — Added more detailed error messages to the Warp Link panel to help diagnose sync failures (e.g., distinguishing between a save failure and a server error).

---

## [2.24.3] — 2026-05-17

### Fix: Build Error

- **Missing Dependency** — Corrected a missing server dependency (`qrcode`) that was preventing the add-on from building correctly in Home Assistant.

---

## [2.24.2] — 2026-05-17

### Fix: Firewall-Proof Warp Links

- **Embedded QR Delivery** — Refactored QR code delivery to use embedded Base64 strings. This completely bypasses `net:ERR_blocked_by_response` errors caused by Home Assistant's strict security policies (COEP/CORP).
- **Global Security Headers** — Added server-wide `Cross-Origin-Resource-Policy` headers to improve reliability for cross-origin assets like emulator cores and WASM modules.

---

## [2.24.0] — 2026-05-17

### Major Feature: In-App Warp Scanner

- **Native QR Scanner** — Integrated a high-performance QR code scanner directly into the mobile dashboard. Users can now scan Warp Links without leaving the Home Assistant app, bypassing 401 Unauthorized errors and session mismatches.
- **Instant Device Handoff** — Scanned links instantly trigger the emulator and automatically load the handoff save state (Slot 9), enabling a seamless transition from PC to mobile in seconds.

---

## [2.23.7] — 2026-05-17

### Fix: Warp Link Save Method

- **Resolved TypeError** — Fixed the `saveState is not a function` error by switching to the established `quickSave` method and adding a reliable fallback to the top-level emulator save function.
- **Extended Sync Timeout** — Increased the retry window and added a slight delay to the synchronization check to ensure that even slower emulator cores have finished writing their data.

---

## [2.23.7] — 2026-05-17

### Stability: Player Logic Restoration

- **Stability Core** — Performed a complete surgical rewrite of the internal player routing logic. This resolves the "inactive button" regression and ensures the Warp Link feature correctly triggers, saves, and generates QR codes across all systems.

---

## [2.23.5] — 2026-05-17

### Fix: Bootstrap recovery & Hardened Warp Link

- **Bootstrap Recovery** — Resolved a syntax error in the dynamically generated `bootstrap.js` script that was causing the emulator to hang during the final loading stage (96%).
- **Hardened Warp Link (Slot 9)** — Moved the handoff logic to Slot 9 to prevent conflicts with auto-saves and added a retry loop with explicit virtual-filesystem flushing to ensure saves are fully ready before QR generation.
- **Enhanced Save Search** — Updated the save-search logic to support a wider range of core-specific filename patterns.

---

## [2.23.3] — 2026-05-17

### Fix: Warp Link Reliability & Dashboard UX

- **Universal Warp Point** — Switched the Warp Link handoff logic to use **Slot 0 (Auto-save)**. This slot is universally supported across all emulator cores, ensuring handoff works for all games.
- **Robust Save Sync** — Added a multi-attempt retry loop with explicit virtual-filesystem flushing. This ensures the core has finished writing the save data before the Warp link is generated.
- **Manual Warp Fallback** — Added a manual link display if Home Assistant's security policies block the external QR code image generation.
- **Click-to-Lock Selection** — Dashboard selection now strictly requires a click. This prevents accidental game switching when moving the mouse toward action buttons.

---

## [2.23.0] — 2026-05-17

### Major: Warp Link Handoff & Dashboard Refinement

- **Warp Link Handoff** — Seamlessly transition gameplay from PC to mobile. Save your game on one device and scan a QR code to continue instantly on another.
- **Enhanced Dashboard UX** — Browsing now requires two presses to launch, allowing you to select a game and view its details/saves without starting the player.
- **Improved Focus Management** — Full synchronization between keyboard, mouse, and gamepad focus states on the main dashboard.

---

## [2.22.16] — 2026-05-17

### Feature: Background Stability & Atomic Syncing

- **Atomic Metadata Imports** — Implemented database transactions for RetroBat (EmulationStation and LaunchBox) XML imports. Library updates are now "all-or-nothing," preventing database inconsistency if a sync is interrupted.
- **Feature: Resume from Last Save** — You can now resume games directly from the dashboard. If a save state exists, a new "Resume" button appears in the game detail panel, automatically loading your latest progress.
- **Feature: Save State Re-Syncing** — Save states are now permanently linked to the game file's unique hash. If you delete and re-upload the same game, the system will automatically find and re-link your previous save states.

---

## [2.22.12] — 2026-05-17

### Feature: Enhanced Scraping & Routing

- **Scraper Enhancement** — Improved TheGamesDB matching logic with fuzzy title fallbacks. Descriptions and release dates are now much more likely to populate for existing games.
- **HA Ingress Routing Fix** — Resolved widespread "Not Found" errors by correctly resolving relative base paths for all API calls when running behind the Home Assistant proxy.
- **Mobile Access Fix** — Added a persistent settings and library icon to the system selector bar, ensuring mobile and tablet users can access the settings panel even when the desktop header is hidden.

---

## [2.22.5] — 2026-05-17

### Fix: BIOS Detection & Visual Polish

- **BIOS Gate Fix** — Resolved "bootstrap.js blocked" error on systems requiring a BIOS (PS1, PS2, SegaCD, GBA, etc.) by correctly handling metadata object lookups.
- **Visual Polish** — Hidden unwanted browser scrollbars for a cleaner "app-like" experience and removed redundant headers on mobile to reclaim screen real estate.
- **Action Update** — Changed primary action button text to "Play Game" for a more standard user experience.

---

## [2.22.1] — 2026-05-17

### Major: Official Rebranding to HomeArcade

- **Official Rebranding** — Fully transitioned from PlayHub to **HomeArcade** across the codebase, UI, and manifests.
- **UX Fix** — Corrected game collection management (fixed `handleToggleCollection` reference).
- **System Stability** — Renamed internal theme components for long-term maintainability.

---

## [2.22.0] — 2026-05-17

### Major: Console-Grade UX Navigation

- **Bidirectional Sidebar Navigation** — Seamlessly jump between the Sidebar and Game Grid using a controller or keyboard. Pressing **ArrowLeft** on the first column of the grid now shifts focus to the Sidebar, and pressing **ArrowRight** from the Sidebar returns focus instantly to the grid.
- **Enhanced Visual Selection** — Focused game cards now feature a more aggressive **1.05x scale effect** and a **high-intensity primary glow**, making the active selection significantly more visible from a distance (perfect for couch gaming).
- **Premium Interaction Timing** — Tuned all navigation transitions to a cinematic **200ms duration** for a smoother, more "snappy" feel that mimics high-end gaming consoles.
- **Intelligent Focus Handshake** — Implemented a custom event-driven focus system that ensures the UI always remembers your last position when switching between navigation zones.

---

## [1.4.1] — 2026-05-15

### Fix: PS2 Upload & Diagnostic Safety

- **Streaming Upload Hashing** — Rewrote the ROM upload logic to stream data directly to disk and calculate hashes incrementally. This eliminates the 2GB memory limit and prevents the "data is too long" crash when uploading large PlayStation 2 ISOs.
- **Frontend Error Boundary** — Integrated a top-level React Error Boundary. If a UI component crashes, the app will now show a descriptive error screen with a "Reload" button instead of a silent white screen.
- **Improved HA Lifecycle** — Refined the `run.sh` startup script to use official `bashio` standards, ensuring add-on options like the 8GB limit are reliably applied.

---

## [1.4.0] — 2026-05-15

### Major: The Definitive Stability Release

- **Super-Logging Diagnostic** — Added comprehensive logging to the entire server boot sequence. If the app fails to start, the Home Assistant logs will now show exactly which step (routes, database, or static server) is causing the issue.
- **Absolute Pathing** — Switched all static file serving to use absolute path resolution. This ensures the app can find its HTML and JS files regardless of the container's working directory.
- **Fail-safe Client** — Injected `import React` into every single UI component to prevent ReferenceErrors that were causing white screens in production environments.
- **Ingress Prefix Robustness** — Refined the URL stripping logic to better handle trailing slashes and nested paths behind the Home Assistant proxy.

---

## [1.3.9] — 2026-05-15

### Fix: Critical Server Boot

- **ESM Compatibility** — Fixed a critical server crash where the app was attempting to use `__dirname` in an ES module environment. Replaced with `process.cwd()` to ensure static assets load correctly.
- **Ingress Stream Restore** — Restored `ingress_stream: true` in the configuration to allow for large ROM uploads through the Home Assistant proxy.

---

## [1.3.8] — 2026-05-15

### Fix: Ingress Navigation & Routing

- **Catch-all Routing Fix** — Corrected the server-side static file server to use a standard Express wildcard (`*`). This ensures the app correctly handles deep links and manual refreshes when running behind Home Assistant Ingress, resolving "Cannot GET" errors and potential white screens.
- **Production React Scope** — Added explicit `import React` to all core components to prevent ReferenceErrors in production builds.

---

## [1.3.7] — 2026-05-15

### Fix: Repository Heartbeat

- **Strict Metadata Sync** — Simplified the add-on configuration to its most robust form to force Home Assistant to recognize the repository. Resolved potential YAML parsing conflicts that were preventing the add-on from appearing in the Store.

---

## [1.3.6] — 2026-05-15

### Fix: Final Repository Sync & Metadata Refresh

- **Store Refresh** — Applied strict YAML quoting and simplified metadata to ensure the add-on appears reliably in the Home Assistant Add-on Store.
- **Cache Break** — Incremented version to force a deep re-scan of the repository configuration.

---

## [1.3.5] — 2026-05-15

### Major: Professional Stability Overhaul

- **Full Type Safety** — Resolved 20+ TypeScript errors across the codebase, ensuring high-end stability and preventing runtime crashes in the Home Assistant environment.
- **Persistent Configuration** — Re-engineered the integration layer to correctly handle persistent settings for system labels, aspect ratios, and shaders.
- **Component Integrity** — Restored missing sub-components on the Settings page and verified all core React imports for the Bento Dashboard.
- **Store Sync** — Standardized `config.yaml` to ensure the app reliably appears in the Home Assistant Add-on Store.

---

## [1.3.4] — 2026-05-15

### Fix: Repository & Stability Final Pass

- **Store Fix** — Applied strict formatting to `config.yaml` to ensure the add-on correctly appears in the Home Assistant Store after re-adding the repository.
- **Stability Pass** — Re-verified all core React imports and JSX structures for the Bento Dashboard and Surprise Wheel.

---

## [1.3.3] — 2026-05-15

### Fix: Critical Runtime Stability

- **Nesting & Component Fixes** — Performed a full surgical cleanup of the Dashboard component to ensure correct JSX nesting and layout grid column spans (maximum 12).
- **Metadata Fixes** — Corrected configuration schema formatting for better Home Assistant compatibility.
- **Icon Integrity** — Verified and fixed all icon imports and usage across the new Bento widgets and Surprise Wheel.

---

## [1.3.2] — 2026-05-15

### Fix: Runtime Stability

- **Import Fix** — Resolved a missing icon import in the Dashboard component that caused a white screen crash in production builds.

---

## [1.3.1] — 2026-05-15

### Major: Advanced Power User Features

- **BIOS & Firmware Manager** — Added a new "System Health" tab in Settings. You can now manage and upload original firmware files for PS1, PS2, Saturn, and Dreamcast directly from the UI, resolving the most common cause of emulator loading issues.
- **Cinematic "Surprise Me" Wheel** — Replaced the instant random pick with a cinematic, high-energy roulette wheel. Let the fates decide your next adventure with a console-like selection animation.
- **Enhanced Bento Widgets** — Expanded the Dashboard with new data-driven modules:
    - **The Wall of Shame** — Highlights games you started but haven't touched in over 30 days.
    - **Longest Session Record** — Proudly displays your most dedicated gaming session.
- **Localization Sync** — Full 7-language support for all new firmware management and dashboard features.

---

## [1.2.6] — 2026-05-15

### Fix: Repository Sync

- **Metadata Refresh** — Incremented version and updated add-on description to force Home Assistant to refresh its repository metadata and acknowledge the 8GB limit update.

---

## [1.2.5] — 2026-05-15

### Fix: Persistent 8GB Limit

- **Config Restoration** — Fixed a bug where the 8GB upload limit would fall back to 2GB in certain environments. The system now correctly respects the 8192 MB ceiling for large PlayStation 2 ISOs across all configurations.

---

## [1.2.4] — 2026-05-15

### Feature: Large ROM Support & UI Fixes

- **Increased Upload Limit** — Boosted the maximum ROM upload size from 2GB to **8GB (8192 MB)** to support large PlayStation 2 ISOs and multi-disc sets.
- **Translation Restore** — Fixed the missing `home.status.summary` translation key across all 7 languages, ensuring the library footer correctly displays your total game and favorite counts.

---

## [1.2.3] — 2026-05-15

### Polish: Landscape Mobile Optimization

- **Compact Navigation** — Significantly reduced the height of the Mobile Top Bar and Bottom Nav in landscape orientation, reclaiming valuable vertical space for game browsing.
- **Adaptive Bottom Nav** — Hidden text labels in the Bottom Nav during landscape mode, providing a cleaner, icon-only interface that maximizes the grid viewport.
- **Hero Scaling** — Refined the height of "Continue Playing" hero sections on both Dashboard and Home pages when in landscape, ensuring the library grid is immediately visible.
- **Gameplay Enhancements** — Verified full-screen landscape gameplay with floating virtual controls for an immersive mobile experience.

---

## [1.2.2] — 2026-05-15

### Polish: Sidebar Configuration

- **Native Trigger** — Replaced the custom toggle button with the official Shadcn `SidebarTrigger`, ensuring the collapsible state is handled correctly by the framework.
- **Mobile Integration** — Refactored the Mobile Top Bar to trigger the Sidebar drawer natively, providing a consistent experience across desktop and mobile.
- **Visual Spacing** — Added `SidebarSeparator` and refined the header/footer alignment for a cleaner, more professional look.
- **Active State Fixes** — Improved the URL-based active link detection to correctly highlight History and Achievements sections.

---

## [1.2.1] — 2026-05-15

### Fix: Build Stability

- **Structural Fixes** — Resolved critical JSX structural errors in the Dashboard component that prevented version 1.2.0 from successfully building and installing in Home Assistant.
- **Improved Layout** — Refined the page wrapping logic to work seamlessly with the new Shadcn Sidebar layout.

---

## [1.2.0] — 2026-05-15

### Major: Professional Shadcn Navigation

- **Persistent Sidebar** — Migrated the custom navigation to the professional Shadcn UI Sidebar foundation. The sidebar is now a top-level component that stays consistent during page transitions.
- **Collapsible Mode** — Added support for "Icon Mode" (collapsing the sidebar to icons only), providing significant extra screen space for game grids on desktop.
- **Keyboard Shortcuts** — Integrated native keyboard support (Cmd+B / Ctrl+B) to toggle the sidebar instantly.
- **Improved Hierarchy** — Refined the organization of systems, collections, and library filters for a cleaner, more intuitive browsing experience.
- **Glassmorphic Refinement** — Maintained and polished the backdrop-blur effects across the new navigation primitives.

---

## [1.1.19] — 2026-05-15

### Fix: Final Localization Cleanup

- **Missing Keys** — Restored missing translation keys for "Status breakdown" on the Dashboard and the "System Library" headings on the Home page, resolving the final remaining raw translation keys.
- **Global Sync** — Re-synchronized all 7 supported languages to ensure 100% translation coverage across the entire app.

---

## [1.1.18] — 2026-05-15

### Fix: UI Translation Mismatches

- **Corrected Keys** — Fixed missing translation keys for Dashboard game counts and "See All" links, resolving issues where raw code keys were visible in the UI.
- **Language Sync** — Fully synchronized the new keys across all 7 supported languages.

---

## [1.1.17] — 2026-05-15

### Polish: Tactile UI Feedback

- **Card Hover Effects** — Added a high-end "tilt-scale" and primary-colored glow effect to game cards on hover. This provides tactile, console-like feedback when browsing with a mouse.
- **Glassmorphism Refinement** — Further tuned the sidebar and navigation blur levels for optimal legibility across all 18 themes.

---

## [1.1.16] — 2026-05-15

### Feature: Cinematic Glassmorphism

- **Glassmorphic Navigation** — Applied a semi-transparent `backdrop-blur-md` effect to the Sidebar and Mobile Bottom Nav, allowing theme colors to bleed through for a more cohesive, high-end feel.
- **Staggered Animations** — Integrated `framer-motion` staggered entrance animations for all Bento Grid modules, creating a premium "app boot" experience when opening the Dashboard.
- **Visual Refinements** — Tuned the Hero section and navigation pill indicators for better contrast and legibility in glassmorphic mode.

---

## [1.1.15] — 2026-05-15

### Feature: "Bento Box" Dashboard

- **Modular Grid** — Completely redesigned the Dashboard using a responsive 12-column Bento Box layout. Content is now organized into cinematic, glassmorphic widgets that adjust perfectly to any screen size.
- **Cinematic Hero** — Enhanced the "Continue Playing" hero with a slow Ken Burns-style zoom effect on artwork and improved information hierarchy.
- **Glassmorphism Styling** — Applied a unified `backdrop-blur` and semi-transparent background to all dashboard modules for a high-end, modern gaming feel.
- **Improved UX** — Refined the Recent Activity list and Highlight cards to better utilize screen space and provide easier navigation.

---

## [1.1.14] — 2026-05-15

### Major: Full Localization Support

- **I18n Architecture** — Fully internationalized the application by replacing all hardcoded English strings with dynamic translation keys.
- **Settings Overhaul** — Localized the entire Settings page, including all tabs, field labels, and hint text.
- **Dashboard & Home** — Localized all stats cards, section headers, search placeholders, and sort options.
- **Multi-language Support** — Synchronized translations across all 7 supported languages (English, Spanish, French, German, Portuguese, Japanese, Simplified Chinese).

---

## [1.1.13] — 2026-05-15

### Polish: Priority Rendering

- **Above-the-fold Optimization** — Applied the `priority` flag to game cards in the Dashboard shelves (In Progress, Recently Played) and the Home page "Jump Back In" section. These items now bypass lazy-loading and use high-priority fetching to ensure the top of the app is always instantly interactive.

---

## [1.1.12] — 2026-05-15

### Feature: Performance & Mobile Optimization

- **Grid Virtualization** — Implemented Intersection Observer for library game cards. Content only renders when in or near the viewport, significantly reducing memory and CPU usage for large collections.
- **Image Priority Loading** — The first 10 items in any grid now use high fetch priority and eager loading to improve initial paint times.
- **Polling Efficiency** — Optimized background polling for "Now Playing" status. Frequency is reduced when idle and paused entirely when the browser tab is hidden.
- **Touch Optimizations** — Disabled auto-playing video previews on touch devices to conserve bandwidth and battery life.
- **Scroll Restoration** — Added automatic scroll management to ensure smooth navigation between the library and other pages.

---

## [1.1.11] — 2026-05-15

### Feature: Theme Visual Polish

- **Win95 Aesthetics** — Added iconic beveled borders to cards, sidebars, and buttons for the Win95 theme.
- **Gameboy DMG Filter** — Implemented a dot-matrix texture overlay and a specialized sepia-green image filter for that classic handheld screen look.
- **Synthwave Glow** — Added neon text shadows and glows to primary UI headers.
- **Arcade Scanlines** — Introduced a subtle scanline overlay for library cards in the Arcade theme.
- **Cyberpunk Sharpness** — Applied high-contrast, zero-radius angular clipping to the Cyberpunk aesthetic.
- **OLED Optimization** — Refined OLED theme with true-black backgrounds and sharper borders.

---

## [1.1.10] — 2026-05-15

### Fix: UI Themes

- **Specificity Fix** — Updated theme CSS selectors to ensure they correctly override the default dark mode variables. Themes like Vaporwave and Gameboy will now apply instantly when selected.
- **Integration Layer** — Synchronized the frontend integration layer with the new theme schema to ensure settings are correctly handled in the state.

---

## [1.1.9] — 2026-05-15

### Fix: Emulator Bootstrap

- **Loader Logic** — Resolved "bootstrap.js blocked" error by correctly passing global display settings to the emulator loader script.
- **Variable Scope** — Fixed a ReferenceError that prevented the dynamic generation of the emulator loading sequence.

---

## [1.1.8] — 2026-05-15

### Feature: 18 UI Themes

- **Thematic Styles** — Implemented full CSS definitions for 18 diverse aesthetics including Synthwave, Gameboy, OLED, Cyberpunk, and Win95.
- **Performance Cleanup** — Removed unused adaptive background CSS to streamline the main stylesheet and improve rendering speed.

---

## [1.1.7] — 2026-05-15

### Fix: Crash Recovery

- **Import Fix** — Resolved a white screen crash caused by a missing `useIntegration` import in the Dashboard component.

---

## [1.1.6] — 2026-05-15

### Fix: Application Boot

- **Logic Restoration** — Restored essential library management code that was accidentally omitted during the display settings refactor.
- **Dependency Isolation** — Broke a circular dependency between Settings and App modules by moving theme definitions to a dedicated shared utility.

---

## [1.1.5] — 2026-05-15

### Major: Enhanced Display & i18n Sync

- **Per-System Overrides** — Users can now set custom Aspect Ratios, Shaders, and Integer Scaling for each gaming system individually.
- **Global Preferences** — Added global fallback settings for aspect ratio and shaders.
- **System Labels Toggle** — New option to hide console names on game cards for a cleaner library aesthetic.
- **Translation Sync** — Fixed a bug where changing the language in Settings would not immediately update the UI; translations now sync instantly via `LanguageManager`.

---

## [1.1.2] — 2026-05-14

### Fix: Scraping & Cheats Restoration

- **Art Scraping Fix** — Resolved a ReferenceError in the Libretro fallback that caused art scraping to fail for many titles.
- **Cheat Retrieval** — Restored the missing `/api/roms/:id/fetch-cheats` route, allowing the UI to pull codes from the Libretro database.
- **Cheat Toggling** — Fixed a bug where enabling/disabling a cheat code would fail due to an incorrect database method name.
- **API Consistency** — Updated the scrape response format to match frontend expectations for immediate UI updates.

---

## [1.1.1] — 2026-05-14

### Fix: Automatic Scraping & RetroAchievements

- **Settings Lookup** — Fixed a bug where service credentials (ssUserId, ssPassword, raUsername, raToken, tgdbApiKey) were being retrieved using incorrect property names in the new modular routes. This restoration fixes automatic art fetching during upload and RetroAchievements progress tracking.

---

## [1.1.0] — 2026-05-14

### Major: Modular Architecture & Enhanced Data Integration

- **Modular Backend** — Retired the 5,500-line monolithic `server/routes.ts` in favour of a clean, specialized module structure under `server/routes/`. This significantly improves maintainability and allows for faster feature development.
- **Enriched Metadata** — The `gamelist.xml` parser now correctly extracts star ratings, play counts, and last-played timestamps for both EmulationStation and LaunchBox formats.
- **Robust Test Isolation** — Implemented lazy database initialization and per-test data directory logic. All 135 integration tests now pass with zero shared-state pollution.
- **Multi-Arch Docker** — Updated the `Dockerfile` to automatically support both AMD64 and ARM64 (aarch64) base images, ensuring a seamless experience on Raspberry Pi 4/5.
- **Public Kiosk Fix** — Restored the missing `/api/kiosk` public configuration route, fixing 404 errors in kiosk mode.
- **Gamepad Isolation Fix** — Resolved a bug where Player 1's bindings would leak into Player 2's empty configuration.

---

## [0.7.39] — 2026-05-11

### Fix: Lovelace card download

- **Public Assets** — Moved `homearcade-card.js`, `manifest.json`, and `sw.js` to a proper `public` directory to ensure they are correctly bundled by Vite.
- **Ingress Support** — Fixed the download link in Settings to be relative, allowing it to work correctly behind Home Assistant Ingress.
- **Port Updates** — Updated setup examples to use the default add-on port (5000).

---

## [0.7.38] — 2026-05-11

### Release

- Bump version to trigger Home Assistant update

---

## [0.7.37] — 2026-05-11

### Feature: Netplay lobby UI

- **New Netplay Lobby** — Create or join rooms via the library header. View active rooms, join with a code, and see player counts.
- **Room Management** — Host can see room code and share it; joining is seamless via the "Join Room" dialog.

---

## [0.7.36] — 2026-05-11

### Feature: ROM scanner

- **Auto-import ROMs** — New "Scanner" tab in Settings allows you to point to a folder on the host and automatically import games into the library.
- **Background Watcher** — Optional toggle to watch for file changes and update the library in real-time.

---

## [0.7.35] — 2026-05-11

### Feature: Smart filter collections

- **Dynamic Collections** — Create game lists based on rules (e.g., "System is NES AND Genre is Platformer").
- **Automatic Updates** — New games matching the filters are added to the collection automatically.

---

## [0.7.34] — 2026-05-11

### Feature: Appearance settings

- **Theme Picker** — New tab in Settings for changing the global UI theme (Default, Synthwave, Game Boy, OLED, etc.) without page reload.

---

## [0.7.33] — 2026-05-11

### Feature: Play status & Live timer

- **Play Status Badges** — "Playing", "Beaten", and "Completed" badges now appear on game cards to help track your backlog.
- **Live Play Timer** — Total play time now updates in real-time while you're in a game.

---

## [0.7.32] — 2026-05-10

### Feature: save state auto-sync from server

- **On game load**, after the emulator is ready, `cabinetAutoSyncFromServer` scans server backups and compares against local IDBFS. Any slots that exist on the server but are missing locally (new browser, cleared IndexedDB) are silently restored. A toast confirms: "☁ Synced N save states from server"
- **Does not overwrite** local saves — only restores slots that are genuinely absent in IDBFS, so intentional local-only states are preserved
- **"☁ Sync from server" button** added to the bottom of the Save-state Manager panel for manual on-demand sync
- Click handler wired to same `cabinetAutoSyncFromServer` function (idempotent — skips slots already present)
- Note: auto-backup to server on each save was already in place since v0.7.26; this release closes the restore side of the sync loop

---

## [0.7.31] — 2026-05-10

### Feature: controller haptics + per-system display options

**Controller haptics**
- New toggle in Settings → Controls: "Gamepad rumble / vibration"
- Stored as `gamepadRumble` in integration settings, applied at game launch
- When disabled, overrides `vibrationActuator` to suppress all rumble events

**Per-system display options**
- New section in Settings → Controls: "Display Options" — one row per system
- Three overrides per system: **Aspect ratio** (Default / 4:3 / 3:2 / 16:9 / 1:1), **Integer scale** (pixel-perfect rendering), **Shader** (None / CRT / Scanlines / Grayscale)
- Options stored in `systemDisplay` integration setting and injected into the bootstrap JS; applied via CSS on canvas after `EJS_emulator_ready`
- Shader value forwarded to `EJS_defaultOptions["shader"]` for EmulatorJS to apply

---

## [0.7.30] — 2026-05-10

### Feature: play time on game cards

- **Game cards now show total play time** — a clock icon + formatted duration (e.g. `2h 34m`, `45m`) appears in the card footer when a game has been played. Takes priority over last-played date; falls back to last-played if no time has been accumulated yet.
- Bulk art scrape and per-game stat display were already fully implemented in prior builds; confirmed working.

---

## [0.7.29] — 2026-05-10

### Feature: sort/filter persistence + video previews in game detail

- **Sort order and genre filter now persist across page loads** — stored in `localStorage` (`ha-sort`, `ha-genre`); picks up exactly where you left off
- **Video preview in game detail dialog** — hover the box art to reveal a ▶ Preview button; clicking it plays the ScreenScraper video clip inline, muted and looping. A "Box art" toggle switches back. Resets automatically when opening a different game.

---

## [0.7.28] — 2026-05-10

### Feature: 2-player controller support

- Added **Player 1 / Player 2** pill toggle at the top of Settings → Controls
- All keyboard bindings and gamepad mappings below the toggle apply to the selected player port
- P2 keyboard bindings stored under `{core}_p2` key; P2 gamepad bindings under `default_p2`
- All control API endpoints (`GET/PUT/DELETE /api/profiles/:id/controls/:core` and `/api/profiles/:id/gamepad-bindings/:gamepadId`) now accept `?port=0|1` query param
- Bootstrap JS fetches both P1 and P2 bindings at game launch — `EJS_defaultControls` is populated with `{ 0: p1Controls, 1: p2Controls, 2: {}, 3: {} }` so EmulatorJS wires up each player's gamepad automatically
- P2 controls section omitted from `EJS_defaultControls` when no P2 bindings have been saved, preserving existing single-player behaviour

---

## [0.7.27] — 2026-05-10

### Fix: save-state thumbnails no longer black

- `cabinetCaptureThumb` now calls `emulator.screenshot()` first — EmulatorJS's built-in method bypasses the WebGL `preserveDrawingBuffer=false` restriction that caused `drawImage()` on the game canvas to always return a black frame
- Falls back to direct canvas read for 2D-rendered cores
- Screenshots from `emulator.screenshot()` are resized down to thumbnail dimensions before upload

---

## [0.7.26] — 2026-05-10

### Fix: save-state backup now reliably reads from IDBFS

- `cabinetBackupSlot` was hardcoding `/{gameId}-{slot}.state` as the IDBFS path, but EmulatorJS path format varies by core — causing "No save data in slot N to back up" even when a save existed
- Now tries multiple candidate paths and scans the IDBFS root for any file matching the slot number pattern before giving up
- Added 800ms delay before the auto-backup after Save so EmulatorJS has time to flush the state file to IDBFS before we attempt to read it

---

## [0.7.25] — 2026-05-10

### Mobile landscape: full-screen game with virtual pad overlaid

- Game canvas now fills `100dvh`/`100dvw` in landscape on mobile instead of splitting the viewport with the pad
- Virtual pad tray overlays the game with no background, border, or shadow so it floats cleanly over the content
- Tighter button sizing and safe-area inset adjustments for landscape layout
- Centering fix for game container (`display: flex`, `align-items: center`, `justify-content: center`)

---

## [0.7.24] — 2026-05-09

### Fix: cheats now actually apply to the emulator on launch

- Bootstrap now fetches enabled cheats for the ROM + active profile at launch time and injects them as `window.EJS_cheats` so the emulator core activates them from the start — previously cheats were stored in SQLite and shown in the UI but never passed to EmulatorJS
- Server-side duplicate guard on `POST /api/roms/:id/cheats` — returns 409 if a cheat with the same code already exists for this ROM + profile
- In-game Add button disables and shows "Adding…" while the request is in-flight; shows "Cheat already exists" toast on 409 instead of silently adding a duplicate

---

## [0.7.23] — 2026-05-09

### Fix: robust `.cht` parser for N64/PS1 split-field format

- Parser now handles both code styles found in the libretro database: combined (`cheatN_code = "8011E2B8+0064"`) used by SNES, GBA, and most systems; and split (`cheatN_address` + `cheatN_value`) used by older N64/PS1 files
- Split pairs are joined as `address+value` to match the combined format

---

## [0.7.22] — 2026-05-09

### Fix: full system coverage for cheat database

- Fixed key mismatches: `sms`/`gamegear` were incorrectly mapped as `master-system`/`game-gear`
- Added missing systems: Atari 2600, Atari 7800, Lynx, PC Engine, Neo Geo, Sega CD, Sega 32X, Virtual Boy, Dreamcast
- All 23 app systems now have cheat database mappings

---

## [0.7.21] — 2026-05-09

### Lazy SQLite cache for cheat database lookups

- Added `cheat_index_cache` and `cheat_file_cache` tables to schema
- First lookup per system fetches the libretro directory listing and caches it for 7 days; first lookup per game fetches and caches the `.cht` file for 30 days — all subsequent lookups are instant and work offline
- `DELETE /api/cheat-cache` endpoint to bust the cache
- Settings → Library: "Clear cheat cache" button

---

## [0.7.20] — 2026-05-09

### Fix: cheat fetch — Contents API with fuzzy title matching

- Replaced GitHub code search (unreliable with space-heavy paths) with the Contents API: list all `.cht` files in the system folder, then pick the best match by counting shared normalised title words with a bonus for prefix matches
- Works reliably for titles with special characters, subtitles, and regional variants

---

## [0.7.19] — 2026-05-09

### Auto-populate cheats from libretro database

- Database icon button next to the Cheats header in the game detail dialog fetches the matching `.cht` file from `libretro/libretro-database` on GitHub
- Shows a scrollable panel of available cheats with checkboxes; All/None shortcuts; "Add N cheats" imports selected codes into the game's cheat list with `enabled: true`
- Supports NES, SNES, N64, GBA, GBC, GB, Genesis, Game Gear, Master System, Saturn, PS1, PS2, PSP, NDS
- `GET /api/roms/:id/fetch-cheats` server endpoint

---

## [0.7.18] — 2026-05-09

### Collection management: inline create, rename, delete

- New collection input is now an inline autoFocus text field (Enter to save, Escape to cancel) — replaces `window.prompt`
- Settings → Library: new Collections section with rename (pencil icon, inline input) and delete (trash + confirm dialog) per collection; shows game count
- `PATCH /api/collections/:id` rename endpoint

---

## [0.7.17] — 2026-05-09

### Game card titles + post-upload art fetch

- Game title now appears as prominent text in the card footer so games are identifiable without hovering, especially on mobile where box art may be missing
- After a successful upload a "Fetch art for N ROMs" button appears in the success banner — clicking it runs scrape-art for each just-uploaded ROM and reports "Art fetched: X/N matched"

---

## [0.7.16] — 2026-05-09

### CSV history export + `homearcade_game_ended` improvements

- `homearcade_game_ended` now always includes `duration_seconds` — falls back to `(endedAt − sessionStart)` if the client didn't send it; also adds `duration_minutes` (rounded) for easier HA template use
- Export CSV button in the History header generates a client-side CSV with columns: Date, Time, Game, System, Duration (s), Duration (formatted); filename includes today's date

---

## [0.7.15] — 2026-05-09

### Per-game drill-down in History

- Click any session row or bar in the Top Games chart to drill into that game's full play history
- Drill-down shows: box art, title, system, and a stat grid (total playtime, session count, average session length, first played); below that, every individual session with date, time, and duration
- Back button returns to the full history view; derived client-side from already-loaded data — no extra API calls

---

## [0.7.14] — 2026-05-09

### Live Now Playing indicator

- Sidebar polls `/api/now-playing` every 5s and shows a pulsing dot with the game title between the logo and nav items when a game is running
- Dashboard shows a Live banner above the Continue Playing hero with a pinging dot, game title, system, and a Details shortcut; fades in box art as a background wash if available

---

## [0.7.13] — 2026-05-09

### Search improvements

- Press `/` or `Cmd+K` anywhere in the library to focus the search box; Escape clears and blurs; inline × button clears
- Search now scans all games regardless of active system/collection filter
- Match includes developer and publisher fields in addition to title, genre, and system
- Result notice bar shows scope and count ("Searching all 284 games — 3 results") with a Clear shortcut

---

## [0.7.12] — 2026-05-09

### Controls tab: active profile sync + modified indicator

- Controls tab in Settings now defaults to the currently active profile and stays in sync if you switch profile while Settings is open
- Modified bindings show a coloured dot next to the label and a tinted border on the button
- Active profile gets an "active" badge in the selector
- Removed the fake "Global" sentinel that was colliding with Player 1's ID

---

## [0.7.11] — 2026-05-09

### Cheat code manager in game detail dialog

- Cheats section in GameDetailDialog: inline add form (description + code, Enter to submit), toggle on/off per cheat, two-step delete confirm, active/total count in header
- Cheats are profile-scoped

---

## [0.7.10] — 2026-05-09

### Save state thumbnails in game detail dialog

- Game detail dialog queries `/api/roms/:id/save-states` and renders a card per slot showing the thumbnail, slot label, and relative save time
- Hover to reveal a two-step delete button; falls back to a Save icon if no thumbnail exists

---

## [0.7.9] — 2026-05-09

### Profile switcher moved to sidebar footer

- `ProfileContext` / `useProfile` hook shares profile state across the app
- Profile switcher moved from library header to sidebar footer for persistent access

---

## [0.7.8] — 2026-05-09

### `homearcade_game_started` event improvements

- Added `art_url` and `release_year` fields to the HA webhook payload so automations can display box art and year without extra lookups

---

## [0.7.7] — 2026-05-09

### Fix: physical gamepad stops responding after ~60s

- Replaced the EmulatorJS gamepad keep-alive with a custom polling loop using `requestAnimationFrame` so the browser never suspends gamepad reads during controller-only sessions

---

## [0.7.2] — 2026-05-09

### 10 era-themed colour schemes

- Added 10 additional themes covering arcade, console, and handheld eras (e.g. Plasma Cabinet, Neo Geo Gold, Game Boy Pocket, Dreamcast Swirl)

---

## [0.7.1] — 2026-05-09

### Four new colour themes

- Midnight Arcade, Famicom Red, Game Boy Green, and CRT Phosphor added to the theme picker

---

## [0.7.0] — 2026-05-09

### Material Design 3 full overhaul

- Complete MD3 colour system: primary/secondary/tertiary container roles, 5-level surface containers, tonal elevation overlays for dark theme
- MD3 shape scale (xs=4px → xl=28px) and full type scale (Display/Headline/Title/Body/Label)
- MD3 state layers replace box-shadow elevation with opacity colour overlays
- Navigation Drawer: active item uses pill-shaped primary-container indicator
- Navigation Bar: MD3 bottom nav with indicator pill under active icon
- Game Cards: MD3 Elevated Card with tonal surface, Level-1 shadow, state layers
- Tailwind config updated with new colour tokens

---

## [0.6.1] — 2026-05-09

### Gamepad button remapper

- Settings → Controls: press-to-capture remapper for connected gamepads; click a RetroArch button name then press a physical button to bind it
- Buttons grouped by Face / System / D-Pad / Shoulder / Analog
- Per-profile: saves to `/api/profiles/:profileId/gamepad-bindings/default`; falls back to standard Xbox/PS layout
- Player bootstrap merges custom gamepad bindings into `EJS_defaultControls`
- Schema: `gamepad_bindings` table

---

## [0.6.0] — 2026-05-09

### TheGamesDB scraper, History page, per-profile game state & key bindings, mobile touch polish

- **TheGamesDB** as primary metadata source (art, description, genre, developer, publisher) with cascade fallback to ScreenScraper → Libretro thumbnails; API key field in Settings → Services
- **Play History page** (`/history`): sessions grouped by day, Top-5 games bar chart, total playtime / most-played / last-session stats
- **Per-profile favorites, ratings, and play status** — `profile_game_state` table; non-default profiles get isolated state
- **Per-profile key bindings** — `profile_control_bindings` table; Settings → Controls: profile selector above system tabs; player bootstrap merges global defaults + profile overrides
- **Mobile touch polish**: `touch-action: manipulation` eliminates 300ms tap delay; `overscroll-contain` on scroll containers; landscape pad compression

---

## [0.5.3] — 2026-05-09

### Upload progress bar

- Real-time per-file and overall progress bars during ROM upload (switched from `fetch` to `XMLHttpRequest` for upload progress events)
- Upload button shows live percentage; file list hidden during upload

---

## [0.5.2] — 2026-05-09

### Fix: bootstrap.js syntax error breaking game launch

- Fixed syntax error introduced in 0.5.1 that prevented any game from loading

---

## [0.5.1] — 2026-05-09

### Working netplay via WebSocket relay

- Netplay now routes through the server's WebSocket relay instead of direct peer connections, making it work through HA Ingress

---

## [0.5.0] — 2026-05-09

### Named profiles, cheats panel, Scanlines/LCD/Phosphor shaders

- **Named player profiles**: create/delete in Settings → Player Profiles; switcher in library header; save states, cheats, and key remaps isolated per profile
- **Cheats panel**: slide-in panel with add/toggle/delete cheat codes, scoped to game + active profile
- **Three new shader presets**: Scanlines, LCD, Phosphor (green monochrome glow)

---

## [0.4.12] — 2026-05-09

### Fix: aspect ratio and filter controls now work

- CSS `!important` overrides added to beat EmulatorJS inline canvas styles that were silently ignoring filter/aspect ratio changes

---

## [0.4.11] — 2026-05-09

### Systems sorted by release date

- System tiles on the home screen now appear in chronological era order

---

## [0.4.0] — 2026-05-09

### Cloud saves, Activity Feed, multi-disc support

- Server-side save state backups survive browser clears and device switches
- Dashboard Activity Feed showing recent play sessions
- Multi-disc PS1 support: `.cue`/`.bin` sets with matching filenames grouped automatically; disc-swap menu appears during play

---

## [0.3.33] — 2026-05-09

### Description previews, video hover, 6 more systems

- Game cards show synopsis on hover; list view shows truncated description as a third line
- Box art hover plays a muted looping video clip if ScreenScraper returned a video URL
- New systems: Sega 32X, Sega CD, Neo Geo, Virtual Boy, Atari 7800, Atari Lynx

---

## [0.3.32] — 2026-05-09

### 5 new systems, CRT quick-toggle, auto-save on visibility change, session history

- New systems: Atari 2600, Sega Saturn, Game Gear, Master System, TurboGrafx-16
- CRT filter quick-toggle button in the in-game menu
- Tab hide (`visibilitychange`/`pagehide`) triggers auto-save to slot 0; next game load detects and offers to restore
- `play_sessions` table and Recent Activity feed on the dashboard (last 12 sessions with title, system, duration, relative time)

---

## [0.3.31] — 2026-05-09

### System thumbnail improvements

- Silhouette watermark + logo overlay + scanline + sheen + vignette layers on system tiles

## [0.3.18] — 2026-05-07

### Mobile: Settings page responsive improvements

- **Tab bar**: 3-column grid on mobile (two rows of three), switches to flex-wrap on sm+; tab labels shrink to `text-xs` on small screens
- **Launch endpoints table**: on mobile the endpoint URL collapses under the game title instead of appearing as a separate column; header hides the Endpoint column heading
- **Controls console selector**: tighter `px-2 py-1` padding and `text-[10px]` on mobile so all system buttons comfortably wrap
- **Binding rows**: reduced horizontal padding on small screens
- **Main content area**: `px-4` on mobile (was `px-5`) to give a touch more breathing room
- **HA Setup code blocks**: explicit `max-w-full` so long YAML lines scroll horizontally without pushing the page layout

---

## [0.3.17] — 2026-05-07

### Fix: save-state manager now shows only the logged-in user's saves

The save slot metadata (labels, timestamps, slot numbers) was stored in the database keyed only by `romId + slot`, so all HA users could see each other's occupied slots in the Save Manager even though the actual emulator save files were already isolated via `EJS_gameID` scoping. This release adds a `userId` column to `rom_save_slots` and scopes all three endpoints (list, upsert, delete) to the requesting user. Existing rows in the old format default to `"default"` and remain accessible to all users until re-saved.

---

## [0.3.16] — 2026-05-07

### Per-user save states (Home Assistant multi-user support)
- **Automatic user detection** — reads HA Ingress headers (`X-Remote-User-Id`, `X-Remote-User-Name`) on every player request; falls back to `"default"` for local dev
- **Scoped `EJS_gameID`** — each user's EmulatorJS IDBFS storage key is prefixed with their HA user ID, so browser-local save states, SRAM, and memory cards are siloed per user automatically
- **Per-user server-side backup paths** — save backup files are now stored under `save-backups/<userId>/<romId>/slot-N.state`; existing backups in the flat layout will no longer appear (migrate manually if needed)
- **`/api/current-user` endpoint** — returns `{ userId, userName }` for the logged-in HA user; useful for client-side display and debugging
- **Username badge in player menu** — the in-game menu now shows a pill badge with the logged-in user's display name (hidden for the default/local-dev user)
- **Save manager user label** — the Save Slots panel subtitle now shows whose saves are being managed

---

## [0.2.0] — 2026-05-07

### New systems
- **Game Boy** (gambatte core) — `.gb`
- **Game Boy Color** (gambatte core) — `.gbc`
- **Nintendo DS** (melonds core) — `.nds`
- **PSP** (ppsspp core) — `.iso`, `.cso`, `.pbp`
- **Dreamcast** (reicast core) — `.cdi`, `.gdi`, `.chd`

### Emulator features
- **Server-side save state backups** — each save slot gains ☁ Backup and ↺ Restore buttons; backups are stored in `/data/save-backups/` and survive browser clears and device switches
- **Gamepad tester** — "Test Pad" button opens a live visualisation of every connected controller with real-time axis and button readout
- **Named controller remap profiles** — remap layouts can be saved as named profiles per game and switched from a drop-down; profiles persist in `localStorage`
- **Netplay** — "Netplay" button opens a host/join room UI backed by EmulatorJS peer connections
- **RetroAchievements in-game integration** — credentials are injected into the emulator at launch so achievements unlock while you play

### Library & metadata
- **ROM MD5 hash** — every upload is hashed at ingest; hash is shown in the game detail dialog and stored in the database
- **EmulationStation XML import** — drop a `gamelist.xml` in Settings to bulk-import game metadata
- **LaunchBox XML import** — same flow with a LaunchBox platform XML export
- **Exact play-time tracking** — session duration is accumulated in the database and shown per game; replaces the old estimated figure
- **Recently Played shelf** — horizontal strip on system and collection pages showing the most recently launched ROMs in that context
- **Kiosk collection picker** — Settings lets you pin a specific collection for kiosk mode so only those games are visible

### RetroAchievements dashboard
- New `/achievements` page (trophy icon in sidebar) showing hardcore/softcore points, global rank, recently played games, and a list of recent unlocks
- RA credentials (username + API token) configured in Settings → RetroAchievements

### PWA
- Web app manifest and service worker bundled with the client
- Installable on Chrome/Edge desktop and iOS/Android via Add to Home Screen
- Offline support for cached assets

### Developer
- Vitest integration test suite (`npm test`) — 12 tests covering ROM list, collections CRUD, 404 handling, kiosk, settings, ES/LB importers, system images, and upload limits
- `vitest.config.ts` added; `test` and `test:watch` scripts in `package.json`

### Fixes
- Dockerfile: replaced `npm ci --include=dev` (invalid flag) with `npm install`; moved `NODE_ENV=production` to after the build so dev dependencies are not skipped during install

---

## [0.1.9] — 2026-05

### Emulator features
- **Save state thumbnails** — each slot captures a screenshot at save time
- **Rewind** — hold the rewind button to step backwards through gameplay
- **Fast-forward / turbo** — hold to run the emulator at increased speed
- **Cheat menu** — exposed the EmulatorJS built-in cheat code interface
- **In-game screenshot capture** — save a PNG of the current frame to your device
- **Shader / filter and aspect ratio controls** — choose CRT, scanline, or pixel-perfect filters and switch between 4:3, 16:9, and original aspect ratios
- **Per-game key remapping** — reassign any emulator button to a physical key or gamepad button; remaps persist per game

### Library & metadata
- **ScreenScraper metadata scraping** — fetch box art, screenshots, descriptions, genre, developer, publisher, and release date from ScreenScraper.fr
- **Genre / tag filtering** — filter any view by genre
- **Sort options** — sort by title, play count, recently played, or upload date
- **ZIP ROM support** — `.zip` and `.7z` archives accepted for all systems; first ROM inside is extracted at launch

### Integration
- **HA play session event logging** — game launch and end events are fired as Home Assistant webhook events, including duration
- **Kiosk / kid mode** — hide settings and management pages; optionally require a PIN to exit

### Fixes
- Build error: moved `extractFirstRomFromZip` to top-level scope so it is available to all route handlers

---

## [0.1.8] — 2026-05

### Emulator features
- **Multi-disc PS1 support** — `.cue`/`.bin` sets with matching filenames are grouped automatically; EmulatorJS disc-swap menu appears during play
- Save state paths corrected for EmulatorJS IDBFS layout

### Collections
- Collections page and API verified; empty-state handling improved

---

## [0.1.5] — 2026-05

### Emulator features
- **PS1 and PS2 controller layout** — L2, R2, L3, R3 buttons mapped; DualShock shoulder layout applied to PSX/PCSX2 cores
- **Save slots** — 4 save state slots with load/save controls in the emulator overlay
- **Memory card support** — PS1/PS2 memory card persistence wired through EmulatorJS

### Systems
- **PlayStation 2** added (pcsx2 core) — `.iso`, `.bin`

---

## [0.1.4] — 2026-05

### Upload
- ROM upload moved onto each system page — the active console is pre-selected so uploads are filed correctly without choosing a system manually
- Upload size cap raised past the Home Assistant ingress default of 16 MB; `ingress_stream: true` set in `config.yaml`; configurable via `max_upload_mb` option (default 2048 MB)
- Mobile upload picker fixed for Android/iOS

### Navigation
- Sidebar system links now drive the library filter via the URL, so the active system is preserved on page reload and is bookmarkable

### Integration
- Integration settings (HA base URL, token, endpoint overrides) persisted server-side in SQLite instead of only in browser `localStorage`

---

## [0.1.3] — 2026-05

### Add-on
- HomeArcade packaged as a Home Assistant add-on (Dockerfile, `config.yaml`, `run.sh`, `repository.yaml`)
- API calls corrected for the `/api/hassio_ingress/<token>/` prefix that HA Ingress prepends
- Add-on build fixed by colocating source with the Dockerfile context

### UI
- Console artwork added to Browse Systems tiles (sourced from Wikimedia Commons)
- Mobile virtual gamepad redesigned — d-pad and face buttons in separate zones to prevent simultaneous-press collisions
- Uploaded ROM management page (delete, view metadata)

---

## [0.1.0] — 2026-05

Initial release.

- React + Vite SPA with Express backend
- Browse Systems page with NES, SNES, N64, GBA, Genesis, PS1, Arcade tiles
- ROM upload with per-system file extension validation
- EmulatorJS in-browser emulation with virtual on-screen gamepad
- SQLite database via Drizzle ORM for ROM metadata and settings
- Game Collections (create, rename, delete; add games from detail dialog)
- All Games view with search
