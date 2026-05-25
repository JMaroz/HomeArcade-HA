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