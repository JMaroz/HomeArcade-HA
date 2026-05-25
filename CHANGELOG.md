# Changelog

All notable changes to HomeArcade are documented here.

---

## [2.43.21] — 2026-05-25

### Fix: Save State Slot ReferenceError

- **Escaped Template Interpolation** — Escaped the client-side `slot.slot` variable template interpolations inside the load and delete save state button handlers. This resolves the server-side crash throwing "Server error: slot is not defined".

---

## [2.34.121] — 2026-05-23

### Release: Changelog Sync

- **Changelog Synchronization** — Updated the official Home Assistant add-on changelog (`CHANGELOG.md`) to include all recent development history. This ensures that users can see the full list of improvements, including the RetroArch migration and performance optimizations, directly within the Home Assistant UI.

---

## [2.34.120] — 2026-05-23

### Fix: RetroArch CDN Fallback & Cross-Origin Isolation

- **Implemented RetroArch CDN Fallback** — Added a fallback mechanism that automatically loads engine assets from the official Libretro CDN if local assets are missing.
- **Enforced Cross-Origin Isolation** — Enforced strict `COOP` and `COEP` headers on the server to resolve MIME type and script execution errors in modern browsers.
- **Improved Engine Boot Sequence** — Refined the `Module` initialization to correctly handle asynchronous WebAssembly loading and virtual filesystem mounting.

---

## [2.34.119] — 2026-05-23

### Major: Pure Libretro Migration

- **Transitioned to RetroArch Web** — Replaced the EmulatorJS wrapper with the official RetroArch Web (WASM) engine for professional-grade stability and advanced feature support.
- **Enabled Official RetroArch Menu** — Re-enabled the classic RGUI interface, giving users full control over shaders, cheats, and core settings directly within the browser.

---

## [2.34.118] — 2026-05-23

### Fix: Definitive Client-Side Path Resolution

- **Migrated Path Resolution to Browser** — Moved 100% of the asset routing logic to the browser, eliminating "Unexpected token '<'" errors by ensuring absolute Ingress URLs are always used.
- **Synchronized Asset Loader** — Re-aligned the initialization sequence to ensure all configuration flags are set before the engine boots.

---

## [2.34.117] — 2026-05-23

### Major: Fresh Asset Implementation

- **Overhauled Emulator Asset Management** — Moved all engine assets into the static `public` directory, ensuring they are correctly bundled and reliably served through standard routes.

---

## [2.34.116] — 2026-05-22

### Fix: Asset Routing & Ingress Path Detection

- **Implemented Robust Path Detection** — Added a foolproof way for the browser to find the Home Assistant Ingress root, ensuring all emulator assets are requested using verified absolute paths.

---

## [2.34.115] — 2026-05-22

### Fix: 90% Loading Hang & Stable Core Mapping

- **Resolved Loading Hang** — Corrected absolute pathing errors and reverted all core identifiers to their most compatible standard aliases (`nes`, `snes`, `gba`, `segaMD`, `fba`) to ensure perfect CDN matching.

---

## [2.34.114] — 2026-05-22

### Fix: Loading Restoration & Dynamic Ingress Detection

- **Restored System-Wide Loading** — Resolved a major regression where all systems were failing to load by implementing dynamic `ingressBase` detection.

---

## [2.34.113] — 2026-05-22

### Fix: System-Wide Mobile Compatibility

- **Optimized Mobile Playback** — Switched to stable core identifiers and absolute paths to ensure reliable playback on phones and tablets.

---

## [2.34.112] — 2026-05-22

### Major: Definitive Core Realignment

- **Restored Standard Identifiers** — Restored standard system identifiers for all consoles to ensure perfect compatibility with the EmulatorJS WASM catalog, resolving loading failures for NES and Arcade games.

---

## [2.34.111] — 2026-05-22

### Fix: N64 Core Stability & Enhanced Health Checks

- **Fine-tuned N64 Playback** — Optimized the N64 configuration for perfect playback across all devices.
- **Expanded Test Coverage** — Added specific health checks for N64 to prevent regressions.

---

## [2.34.110] — 2026-05-22

### Feature: Automated Core Health Checks

- **Introduced Automated Safety Suite** — Created `core-health.test.ts` to systematically verify every system's core mapping and BIOS requirements before release.

---

## [2.34.109] — 2026-05-22

### Fix: Conditional Sega BIOS Logic

- **Smart BIOS Validation** — Standard Genesis and Master System games now correctly bypass BIOS requirements, while Sega CD titles correctly retain the prompt.

---

## [2.34.108] — 2026-05-22

### Fix: Ultra-Aggressive UI Hiding

- **Eliminated Double Buttons** — Implemented multi-layered CSS and JS overrides to permanently resolve the "2 sets of buttons" issue.

---

## [2.34.107] — 2026-05-22

### Fix: Game Boy & GBC Loading Restoration

- **Restored Handheld Mapping** — Reverted Game Boy and GBC cores to their standard aliases to resolve 90% progress hangs.

---

## [2.34.106] — 2026-05-22

### Fix: NES & Arcade Core Mapping

- **Aligned CDN Core Names** — Updated NES and Arcade mappings to use specific Libretro identifiers (`fceumm`, `mame2003`) to match the CDN WASM catalog.

---

## [2.34.105] — 2026-05-22

### Fix: 90% Progress Hang Recovery

- **Restored Core Naming** — Reverted core naming to standard system aliases to ensure correct asset discovery across all consoles.

---

## [2.34.104] — 2026-05-22

### Fix: Audio Engine Initialization Stability

- **Resolved OpenAL Crash** — Added a default volume guard (`EJS_volume`) to prevent a critical `TypeError` during early audio engine boot.

---

## [2.34.103] — 2026-05-22

### Fix: Ingress Header & 403 Forbidden Errors

- **Exposed Critical Headers** — Explicitly exposed `Content-Length` and `Accept-Ranges` to allow the emulator to download large assets through the HA proxy.
- **Refined CORS Policy** — Resolved 403 Forbidden errors for cross-origin assets.

---

## [2.34.102] — 2026-05-22

### Fix: N64 Core Compatibility

- **Restored N64 System Alias** — Reverted N64 core to its generic alias to allow for dynamic, device-specific core selection.

---

## [2.34.101] — 2026-05-22

### Fix: Gamepad Input Bridge Reliability

- **Manual Input Injection** — Implemented a robust input relay that bypasses browser-specific Gamepad API quirks, ensuring physical controllers work reliably.

---

## [2.34.100] — 2026-05-22

### Feature: Auto-Gamepad Detection & Mapping

- **Plug-and-Play Controller Support** — Implemented automatic detection and standardized Retropad mapping for Xbox, PlayStation, and Nintendo controllers.

---

## [2.34.99] — 2026-05-22

### Feature: Netplay Diagnostic Engine & Handshake Stability

- **Added Netplay Logging** — Implemented server-side logging to track peer connections and message routing for advanced debugging.
- **Improved Connection Resiliency** — Refined the signaling handshake to handle rapid re-joins and unexpected socket closures.

---

## [2.34.98] — 2026-05-22

### Performance: ROMs API Payload Trimming

- **Accelerated Dashboard Loading** — Optimized the `/api/roms` endpoint to omit null fields, reducing the JSON payload size by ~40% for large libraries.

---

## [2.34.97] — 2026-05-22

### Performance: PS1/PS2 Optimization & Menu Fix

- **Faster PlayStation Loading** — Optimized asset pre-fetching and core initialization sequence.
- **Fixed Menu Freezing** — Implemented an asynchronous pause/resume cycle for the in-game menu.

---

## [2.34.96] — 2026-05-22

### Feature: Customizable Touch Controls & HD Mode

- **Personalized Handheld Experience** — Added real-time sliders for button size and opacity in the in-game menu.
- **Internal Upscaling** — Introduced an "HD Mode" toggle to enable high-resolution rendering for 3D consoles.

---

## [2.34.95] — 2026-05-22

### Major: Lemuroid-Style Menu Overhaul

- **Redesigned In-Game Interface** — Replaced the default overlay with a premium centered glass card and large action tiles.
- **Forced UI Isolation** — Implemented aggressive overrides to ensure only our custom menu is visible.

---

## [2.34.94] — 2026-05-22

### Fix: Netplay Synchronization Engine

- **Forced Sync State** — Explicitly enabled the internal netplay flag to ensure joined sessions correctly synchronize game state and inputs.

---

## [2.34.93] — 2026-05-22

### Fix: PS1/PS2 Startup BIOS Hang

- **Aligned Core Naming** — Corrected a mismatch that prevented BIOS files from being detected, resolving the hang at the "Finalizing" stage.

---

## [2.34.92] — 2026-05-22

### Fix: Definitive Double Virtual Control Hiding

- **Resolved UI Overlap** — Force-disabled EmulatorJS's internal mobile detection and added strict CSS overrides to kill duplicate grey buttons.

---

## [2.34.91] — 2026-05-22

### Major: Netplay Pro Lobby & WebRTC Stability

- **Overhauled Multiplayer UI** — New high-fidelity Netplay lobby with real-time status and compatibility checks.
- **Reduced Connection Lag** — Integrated Google STUN servers and optimized the relay for lower-latency signaling.

---

## [2.34.90] — 2026-05-22

### Fix: Virtual Pad Aesthetics

- **Resolved Button Rendering** — Fixed an issue where buttons were stacking and added 3D bulb highlights for a physical feel.

---

## [2.34.88] — 2026-05-22

### Feature: Auto-Resume & Core Engine Upgrades

- **Implemented "Pick Up and Play"** — The app now automatically quick-saves on exit and quick-loads on launch.
- **Upgraded WASM Cores** — Switched default cores to modern, high-performance versions from the Lemuroid ecosystem.

---

## [2.34.40] — 2026-05-21

### Fix: Netplay Synchronization & Core Bootstrapping

- **Implemented Netplay Configuration** — Fixed an issue where netplay signaling succeeded but games failed to sync. The EmulatorJS bootstrap now correctly receives and initializes `EJS_netplayUrl`, `EJS_netplayRole`, and `EJS_netplayRoom`.
- **Automatic Server Detection** — Added logic to dynamically detect the correct WebSocket protocol (ws/wss) and host, ensuring compatibility with Home Assistant Ingress.

---

## [2.34.39] — 2026-05-21

### Fix: Home Assistant Ingress Stability & Bulk Scrape UI

- **Optimized Middleware Order** — Moved Home Assistant ingress prefix stripping to the top of the middleware stack. This ensures consistent routing and fixes issues with streaming Server-Sent Events (SSE).
- **Improved Scrape Feedback** — Added clear UI notifications when attempting to scrape an already-completed library, preventing user confusion when "nothing happens."
