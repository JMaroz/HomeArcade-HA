## 2.46.1 - 2026-06-27

- **Fix**: **Upload Auto-Detect & Crash Fixes** - Fixed `.bin` detection to prefer PS1 over Genesis for ambiguous audio tracks (CD sync byte check). Fixed "cannot read property" runtime crash by moving AbortController creation before the `setFiles` call. Added missing `manualUpload` locale strings. Added console logging for easier debugging.

## 2.46.0 - 2026-06-27

- **Feature**: **Upload System Overhaul** - Complete rewrite of the upload pipeline with four interdependent enhancements: (1) auto-detection of console system from file extension, magic bytes, and folder context — no more manual system picker for single-file uploads; (2) enhanced upload status with real-time speed/ETA tracking via sliding window, per-file status table (pending/uploading/uploaded/failed/cancelled/skipped), individual Cancel and Cancel All buttons, and error recovery that continues on per-file failure; (3) duplicate ROM detection with an interactive dialog offering Keep Both / Replace / Skip per-file or apply-all; (4) folder upload via `webkitdirectory` with automatic grouping of multi-file games (CUE/BIN PS1 tracks) and folder-name-based system detection.

- **Feature**: **Libretro-Only Art Matcher** - Replaced ScreenScraper (requires account) and TheGamesDB (requires API key) with a new zero-auth art matching system that scrapes `thumbnails.libretro.com` directory listings. Uses a multi-strategy scorer (exact match, contains fuzzy, token overlap, region bonus) with 24-hour caching. Removed associated `ssUserId`, `ssPassword`, and `tgdbApiKey` fields from schema, settings UI, and locale. Deleted the dead `scraperHelpers.ts` duplicate.

- **Fix**: **BIOS MD5 Checksums** - Corrected 5 incorrect MD5 checksums in `bios-metadata.ts` (SCPH-39001.bin, bios_CD_{U,E,J}.bin, dc_flash.bin) that were silently deleting downloaded BIOS files after mismatch detection.

## 2.44.0 - 2026-06-26

- **Feature**: **ROM Directory Browser & Scanner Diagnostics** - Added an in-app directory picker dialog for browsing and selecting ROM watch paths in the Library settings. Scanner status now tracks per-path found/imported counts and timestamps. Add-on configuration options (`data_dir`, `rom_watch_dir`) are read from `/data/options.json` for Supervisor UI support.

## 2.43.36 - 2026-06-05

- **Feature**: **Keyboard Customization & Controller Templates** - Integrated keyboard input remapping controls within the settings page, and enabled template layout injection during bootstrap. Added standard templates for Xbox, PlayStation, and Nintendo Switch gamepad layouts to easily apply pre-configured control maps.

## 2.43.35 - 2026-05-26

- **Feature**: **Symmetrical Pause Menu & 9-Slot Save State Manager** - Moved the Exit Game button into the pause menu grid (completing a clean 3x2 design) and replaced the direct Save/Load buttons with a single "Saves" button. Upgraded the Saves panel to a robust 9-slot Save State Slot Manager, allowing users to load, overwrite/save, or delete from any of the 9 slots with dynamic thumbnails and empty state dashed placeholders.

## 2.43.34 - 2026-05-26

- **Feature**: **Full Bluetooth Controller Button & Axis Remapping** - Integrated `ControllerRemapDialog` into the Input settings section, allowing users to map physical buttons and analog axes. Added support for remapping both Player 1 and Player 2 controllers separately. Enabled the in-browser emulator page to dynamically load gamepad configurations at runtime and translate button presses and axis directions. Passed custom UI navigation mapping configurations to the dashboard grid navigation hook.

## 2.43.33 - 2026-05-25

- **Fix**: **Netplay Input & State Sync** - Fixed a bug where Netplay room connections succeeded but game sessions failed to synchronize by restoring the missing injection of `EJS_netplayUrl`, `EJS_netplayRole`, and `EJS_netplayRoom` variables in the generated player bootstrap template.
- **Improved**: **Automated E2E Server** - Updated `playwright.config.ts` with a `webServer` block to automatically start and stop the development server during E2E test runs.

## 2.43.32 - 2026-05-25

- **Fix**: **Pause Menu Action Bindings** - Corrected the pause menu actions (Restart, Save, Load, Saves panel, and Warp QR generation) by mapping them to the proper nested `EJS_emulator.gameManager` functions instead of non-existent top-level methods. Fixed the `unpause()` runtime crash by calling `play()`.

## 2.43.31 - 2026-05-25


- **Fix**: **Home Assistant Repository Sync** - Corrected the repository URL in `repository.yaml` to ensure the Supervisor Add-on Store discovers new updates cleanly.

## 2.43.30 - 2026-05-25


- **UX/UI Redesign**: **Pause Menu Glassmorphism Redesign & Warp Play** - Redesigned the pause menu layout with glassmorphic cards and buttons. Replaced raw emojis with animated inline SVG icons. Implemented a fully functional Warp QR code panel that uploads session states to the server in real-time and enables users to scan the QR code to auto-resume play on another device. Fixed sync-from-server to download binary save backups.

## 2.43.29 - 2026-05-25

- **Fix**: **Interface accordion visibility & E2E spec selectors** - Configured Interface settings section to be defaultOpen so controls are visible to automated test scripts. Corrected theme label E2E selectors to prevent strict-mode violations, and updated Sidebar/History to map paginated ROM query responses.

## 2.43.28 - 2026-05-25

- **UX/UI Redesign**: **Ergonomic Virtual Gamepad Redesign** - Redesigned the touch virtual gamepad layout in `player.ts` with premium glassmorphic circular plates for both the D-pad and face buttons. Added a classic center-pivot cap overlay for the D-pad cross. Relocated the L and R trigger buttons to be positioned ergonomically directly above the left and right controller zones to prevent overlaps with the Menu button. Implemented CSS variables and responsive media query scaling so that the layout shrinks from 64px to 46px base button size on screens under 480px, avoiding middle overlap in portrait mode.

## 2.43.27 - 2026-05-25

- **Fix**: **Mobile game display padding & hidden touch controls** - Added `padding-top: 50px` on mobile layouts to move the game display down and clear the header. Expanded virtual gamepad hiding CSS rules and configured an off-screen dummy button for `EJS_VirtualGamepadSettings` to fully disable the default EmulatorJS touch controls.

## 2.43.26 - 2026-05-25

- **Fix**: **Duplicate mobile virtual gamepads** - Set `window.EJS_VirtualGamepadSettings = []` and corrected the casing of `window.EJS_Buttons` to prevent EmulatorJS's default virtual controller overlay from appearing on mobile devices alongside HomeArcade's custom virtual gamepad.

## 2.43.25 - 2026-05-25

- **Feature**: **Expose Port 5000 Config Mapping** - Added `ports` configuration mapping in `config.yaml` for port `5000/tcp` to enable direct network access via the Home Assistant host, bypassing the Supervisor Ingress proxy.

## 2.43.24 - 2026-05-25

- **Fix**: **Missing closing brace on cabinetSetupMenu** - Added the missing closing curly brace `}` for the `cabinetSetupMenu` function that was accidentally cut during clean-ups. This resolves the `Uncaught SyntaxError: Unexpected end of input` crash at game load.

## 2.43.23 - 2026-05-25

- **Refactor**: **Clean event delegation for Save grid** - Refactored `renderSaveGrid` to use HTML5 data attributes (`data-action`, `data-slot`) and container-level event delegation instead of complex nested inline `onclick` string attributes. This cleanly separates markup from JS logic, makes the code easier to read, and prevents any escaping/nesting bugs.

## 2.43.22 - 2026-05-25

- **Fix**: **Wired missing Save manager HTML and secured onclick registrations** - Added the missing `cabinet-save-panel` HTML structure and CSS styling inside `renderEmulatorPage` so that the saves panel displays correctly. Additionally, introduced a `safeOnClick` guard for all pause menu elements in `cabinetSetupMenu` to prevent `Uncaught TypeError: Cannot set properties of null (setting 'onclick')` crashes when any optional menu controls/panels are absent in the DOM.

## 2.43.21 - 2026-05-25

- **Fix**: **Escape slot variables in player.ts** - Escaped `slot.slot` template variable interpolations in the onclick load/delete button handlers inside the renderEmulatorPage template literal. This resolves the server-side "slot is not defined" ReferenceError.

## 2.43.12 - 2026-05-24

- **Fix**: **cabinetToast Unicode Escape in HTML Attributes** - Replaced unicode escape sequences with actual emoji characters in renderSaveGrid cabinetToast calls. The escape sequences inside HTML onclick attributes were being parsed as literal text, causing JS syntax errors.## 2.43.11 - 2026-05-24

- **Fix**: **Save Grid Template Literal Escaping** - Fixed `SyntaxError: Unexpected identifier 'color'` on game launch caused by HTML attributes with unescaped double quotes inside the outer template literal in `renderSaveGrid`. All HTML attribute values in save/load buttons now use single-quoted strings, eliminating the escape sequence issue.

## 2.42.15 - 2026-05-23

- **Fix**: **Player Page Regex Syntax Error** - Fixed the regex `/api/roms/` inside the template literal for `renderEmulatorPage`. The forward slashes in the regex were being stripped during template evaluation, producing invalid JS like `path.match(//api/roms/(d+)//)` instead of `path.match(/\/api\/roms\/(\d+)\/)/`. This caused "Unexpected token 'var'" on all system pages.

## 2.42.15 - 2026-05-23

- **Fix**: **Player Page Regex Syntax Error** - Fixed the regex `/api/roms/` inside the template literal for `renderEmulatorPage`. The forward slashes in the regex were being stripped during template evaluation, producing invalid JS like `path.match(//api/roms/(d+)//)` instead of `path.match(/\/api\/roms\/(\d+)\/)/`. This caused "Unexpected token 'var'" on all system pages.

## 2.42.12 - 2026-05-23

- **Fix**: **ROM Range Download Path** - Fixed the Range-response branch in `/api/roms/:id/file` that was using a forward-slash-normalized string path instead of the OS-native path for `fsSync.createReadStream`. On Windows, streaming a ROM with a forward-slash path returns empty content, causing games to fail to load with a silent black screen.

## 2.42.0 - 2026-05-23

- **Stabilization**: **Foundation Finalized** - Verified all build manifests and synchronized versions across the new repository for definitive Home Assistant deployment.

## 2.40.0 - 2026-05-23

- **Stabilization**: **Build System Established** - Core infrastructure for HomeArcade ready for deployment.

## 2.38.0 - 2026-05-23

- **Stabilization**: **Dependencies Updated** - Dependencies updated and pinned for stability.

## 2.37.0 - 2026-05-23

- **Feature**: **Core Functionality Complete** - All core features for HomeArcade up and running.

## 2.36.0 - 2026-05-23

- **Refactor**: **Emulator Bridge Foundation** - Built out core emulator bridge infrastructure for Home Assistant integration.

## 2.35.0 - 2026-05-23

- **Stabilization**: **Foundational Improvements** - Core HomeArcade systems initialized and stabilized.

## 2.34.0 - 2026-05-23

- **Fix**: **API Routes Corrected** - Corrected API route handlers for better stability.

## 2.33.0 - 2026-05-23

- **Feature**: **Emulator Core Stabilized** - Emulator core systems stabilized with proper configuration.

## 2.32.0 - 2026-05-23

- **Feature**: **UI Overlay Complete** - Overlay UI system for the emulator with loading states, menu navigation, and controller bindings established.

## 2.31.0 - 2026-05-23

- **Fix**: **HD Mode Toggle** - HD Mode toggle with aspect ratio selection.

## 2.30.0 - 2026-05-23

- **Feature**: **State Management** - Save slot management, state saving, loading, and deletion implemented.

## 2.29.0 - 2026-05-22

- **Feature**: **Save Management** - Save management with cabinet UI.

## 2.28.0 - 2026-05-22

- **Feature**: **Emulator Bootstrap** - Bootstrap and launch emulators with library game selection.

## 2.27.0 - 2026-05-22

- **Feature**: **Emulator Loading** - Emulator loading with HD mode support.

## 2.26.0 - 2026-05-22

- **Feature**: **State Management** - Save/load game state with cabinet UI feedback.

## 2.25.0 - 2026-05-22

- **Feature**: **Art Download** - Art and cover image downloading with fallback.

## 2.24.0 - 2026-05-22

- **Feature**: **Art Fetching** - Art fetching and caching with CDN URL generation.

## 2.23.0 - 2026-05-22

- **Feature**: **ROM Library** - ROM library with metadata and search.

## 2.22.0 - 2026-05-22

- **Feature**: **Library Browser** - Game library browser with filtering.

## 2.21.0 - 2026-05-22

- **Feature**: **Game Scanner** - Scanner with game detection and auto-import.

## 2.20.0 - 2026-05-22

- **Feature**: **System Scanner** - System and game scanner with artwork.

## 2.19.0 - 2026-05-22

- **Feature**: **Game Detection** - Game detection and system identification.

## 2.18.0 - 2026-05-22

- **Feature**: **System Detection** - System detection with emulator identification.

## 2.17.0 - 2026-05-22

- **Feature**: **Rom Import** - ROM import with multi-file support.

## 2.16.0 - 2026-05-22

- **Feature**: **File Verification** - File verification and import confirmation.

## 2.15.0 - 2026-05-22

- **Feature**: **Upload Processing** - Upload processing and file management.

## 2.14.0 - 2026-05-22

- **Feature**: **Upload Management** - Upload management with duplicate detection.

## 2.13.0 - 2026-05-22

- **Feature**: **Upload API** - Upload API with size validation.

## 2.12.0 - 2026-05-22

- **Feature**: **File Upload** - File upload handling with metadata.

## 2.11.0 - 2026-05-22

- **Feature**: **ROM Upload** - ROM upload and import system.

## 2.10.0 - 2026-05-22

- **Feature**: **File Management** - File management and deletion.

## 2.9.0 - 2026-05-22

- **Feature**: **ROM Deletion** - ROM deletion with cascade cleanup.

## 2.8.0 - 2026-05-22

- **Feature**: **ROM Management** - ROM management API routes.

## 2.7.0 - 2026-05-22

- **Feature**: **Art Management** - Art management with URL extraction.

## 2.6.0 - 2026-05-22

- **Feature**: **System Management** - System management with artwork.

## 2.5.0 - 2026-05-22

- **Feature**: **Metadata API** - Metadata API with search and filtering.

## 2.4.0 - 2026-05-22

- **Feature**: **Database Schema** - Database schema with relationships.

## 2.3.0 - 2026-05-22

- **Feature**: **Data Models** - Data models for systems, ROMs, and metadata.

## 2.2.0 - 2026-05-22

- **Feature**: **Database Layer** - Database layer with query optimization.

## 2.1.0 - 2026-05-22

- **Feature**: **Storage System** - Storage system with file organization.

## 2.0.0 - 2026-05-22

- **Initial Release**: **HomeArcade Foundation** - Foundation for HomeArcade, a Home Assistant add-on for retro gaming.