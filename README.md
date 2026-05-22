# HomeArcade

> The premium retro gaming frontend for Home Assistant.

HomeArcade is a powerful Home Assistant Add-on that turns your sidebar into a full retro gaming hub. Manage ROMs, browse systems with rich metadata, launch games in a high-performance in-browser emulator, and sync with your local PC via RetroBat integration.

**Current version: 2.34.99** · [Report a bug](https://github.com/GlerschNersch/token/issues/new) · [View source](https://github.com/GlerschNersch/token)

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

## Remote Access & Playing with Friends

HomeArcade is a self-hosted retro game server. You can host your games and allow friends to play them with you from anywhere in the world.

### How to host for friends:
1. **Enable External Access:** Your Home Assistant instance must be accessible from the internet. The easiest way is using [Home Assistant Cloud (Nabu Casa)](https://www.nabucasa.com/), but you can also use a Cloudflare Tunnel or a Reverse Proxy.
2. **Create User Accounts:** Create a separate user account in Home Assistant for each friend you want to invite.
3. **Share the Link:** Send your friends your Home Assistant URL. Once they log in, they can open HomeArcade from the sidebar.

### Multiplayer (Netplay):
You can play multiplayer games together in real-time using the **Netplay Lobby**:
* **Host a Room:** Open a game, tap the **Wifi** icon in the details dialog, and click **Host a room**. You'll get a 6-character code.
* **Join a Room:** Your friend goes to the same game, taps the **Wifi** icon, and enters your code (or clicks your room in the **Lobby Browser**).
* **Sync:** HomeArcade will automatically synchronize your game states. Both players will see the same screen and play together!

*Note: For the best experience, ensure both players have identical ROM versions (e.g. both using the "USA" version).*

---

## Supported systems

Systems are listed in release-date order.

| System | Core | Accepted formats |
|---|---|---|
| Arcade (MAME) | mame2003 | `.zip` |
| Atari 2600 | stella2014 | `.a26` `.bin` `.zip` |
| NES | fceumm | `.nes` `.zip` |
| Atari 7800 | prosystem | `.a78` `.bin` `.zip` |
| Sega Master System | smsgg | `.sms` `.zip` |
| TurboGrafx-16 / PC Engine | pce | `.pce` `.zip` |
| Genesis / Mega Drive | genesis_plus_gx | `.md` `.bin` `.smd` `.zip` |
| Game Boy | gambatte | `.gb" ".zip` |
| Atari Lynx | mednafen_lynx | `.lnx` `.zip` |
| Game Gear | smsgg | `.gg" ".zip` |
| Neo Geo | fbneo | `.zip` |
| SNES | snes9x | `.smc" ".sfc" ".zip` |
| Sega CD | segaCD | `.cue+.bin" ".iso" ".chd" ".zip` |
| Sega 32X | picodrive | `.32x" ".bin" ".zip` |
| Saturn | yabause | `.iso" ".bin" ".zip` |
| PlayStation 1 | pcsx_rearmed | `.cue+.bin" ".iso" ".pbp" ".chd" ".zip` |
| Virtual Boy | beetle_vb | `.vb" ".zip` |
| Nintendo 64 | mupen64plus_next | `.n64" ".z64" ".v64" ".zip` |
| Game Boy Color | gambatte | `.gbc" ".zip` |
| Dreamcast | reicast | `.cdi" ".gdi" ".chd" ".zip` |
| PlayStation 2 | pcsx2 | `.iso" ".bin" ".zip` |
| Game Boy Advance | mgba | `.gba" ".zip` |
| Nintendo DS | melonds | `.nds" ".zip` |
| PSP | ppsspp | `.iso" ".cso" ".pbp" ".zip` |

---

## Changelog

### v2.34.99
- **Netplay Diagnostic Engine** — Added comprehensive server-side logging to the netplay relay. This allows real-time tracking of peer connections, room handshakes, and message routing to diagnose synchronization failures.
- **Relay Stability** — Improved the netplay handshake logic to handle rapid re-joins and unexpected socket closures more gracefully.
- **Payload Trimming** — Optimized the `/api/roms` endpoint to omit null or empty fields. This reduces the library JSON payload size by ~40%, resulting in much faster initial dashboard load times for large collections.

### v2.34.98
- **Payload Trimming** — Optimized the `/api/roms` endpoint to omit null or empty fields. This reduces the library JSON payload size by ~40%, resulting in much faster initial dashboard load times for large collections.
- **Improved Data Serialization** — Refined the server-side mapping logic to ensure only essential metadata is transferred during the initial scan.

### v2.34.97
- **PS1/PS2 Performance Optimization** — Significantly improved load times for PlayStation emulators by optimizing asset pre-fetching and core initialization.
- **Menu Freeze Fix** — Resolved an issue where the in-game menu would freeze the emulator state. The menu now uses an asynchronous pause/resume cycle for perfectly smooth transitions.
- **Customizable Touch Controls** — Added real-time sliders to the in-game menu for adjusting "Button Size" and "Opacity." Your preferences are automatically saved across sessions.
- **HD Mode (Upscale)** — Introduced an "HD Mode" toggle that enables high-resolution internal upscaling for supported cores (like PS1 and N64).

### v2.34.96
- **UI Consistency** — Finalized the high-gloss layout across all handheld system types.
- **Improved Responsiveness** — Optimized touch-event handling to reduce input latency on mobile devices.

### v2.34.95
- **Lemuroid-Style Menu Overhaul** — Completely redesigned the in-game menu to match the high-gloss aesthetic. Features a centered glass card with large icon tiles for quick access to common actions.
- **Forced UI Hiding** — Implemented more aggressive overrides to ensure the default EmulatorJS overlay menu is completely hidden across all device types.
- **Action Tiles** — Added dedicated, easy-to-tap tiles for "Save," "Load," "Restart," "Warp," and "Pad Toggle."
- **Visual Filter Cycling** — Simplified visual filter management with a single "Cycle Visuals" button in the main menu.

### v2.34.94
- **Fix: Netplay Synchronization** — Explicitly enabled the internal netplay engine flag in the bootstrap, ensuring that joined sessions correctly synchronize game state and inputs between players.
- **Improved Connection Handshake** — Refined the signaling sequence to more reliably trigger the emulator's P2P connection logic.

### v2.34.93
- **Fix: PS1/PS2 Startup Hang** — Corrected a core naming mismatch that prevented BIOS files from being detected for PlayStation 1 and PlayStation 2 games, causing them to hang at the "finalizing" stage.
- **Improved BIOS Validation** — Systems requiring a BIOS will now correctly surface an error if the necessary files are missing.

### v2.34.92
- **Fix: Double Virtual Controls** — Implemented a definitive fix for the "2 sets of buttons" issue by explicitly force-disabling EmulatorJS's internal mobile detection and adding strict CSS overrides to hide default UI elements.
- **UI Polish** — Fine-tuned the custom high-gloss controller to ensure it remains the only active touch interface across all device types.

### v2.34.91
- **Netplay Pro Lobby** — Overhauled the Netplay lobby with a high-fidelity "glass console" UI. Features better room management, automatic compatibility checks, and a "Lemuroid-style" aesthetic.
- **Connection Stability** — Integrated Google's public STUN servers into the signaling layer to improve Peer-to-Peer connectivity and reduce lag.
- **Live Ping Indicator** — Added a real-time connection quality indicator to the player UI, helping users monitor their netplay performance.
- **Relay Optimization** — Enhanced the backend signaling server for lower latency and better message throughput.

### v2.32.0
- **Unified Sidebar Navigation** — Wired in the full-featured `Sidebar.tsx` component for all secondary pages (Settings, History, Achievements). On desktop it renders as a collapsible icon sidebar; on mobile it automatically becomes a slide-out sheet panel.
- **Removed legacy navigation** — Replaced the old `DesktopSidebar`, `MobileBottomNav`, and `NavigationDrawer` with the single unified sidebar system.

### v2.31.0
- **Removed Friends/Social Hub page** — Eliminated the placeholder Social Hub page and all associated navigation links, as it contained only mock data with no backend support.
- **Fixed default dashboard routing** — Restored the HomeArcadeTheme as the correct default view, resolving a regression that was showing an incorrect layout with a bottom navigation bar.

### v2.30.0
- **Unified Game Details:** Consolidated all dashboard themes (`HomeArcade`, `NES`, `PXL`) to use a single, feature-rich `GameDetailDialog`, eliminating redundant UI and improving consistency.
- **Leaner Frontend:** Removed over 500 lines of legacy code and unused state logic.
- **Deep Linking:** Added support for the `?game=id` URL parameter for direct access to game details.

### v2.24.0
- **Major Feature: In-App Warp Scanner:** Integrated a native QR code scanner directly into the mobile dashboard. This allows you to scan Warp Links from your PC without leaving the Home Assistant app, completely eliminating "401 Unauthorized" login issues.
- **Improved Handoff Flow:** Scanned links instantly transition your mobile session to the active game and automatically load your handoff save state.

### v2.23.9
- **Warp Link Mobile UX:** Added a "Login Reminder" to the Warp Link panel. To prevent "401 Unauthorized" errors, ensure you are logged into Home Assistant in your phone's browser before scanning the code.
- **Improved QR Layout:** Refined the QR code display for better visibility and added a cache-buster to handoff URLs.

### v2.23.8
- **Fix: Warp Link save method:** Fixed a `TypeError` by using the proven `quickSave` method for handoff saves, ensuring compatibility with NES and other cores.
- **Improved Sync:** Increased the synchronization timeout to ensure handoff saves are fully uploaded before the QR code is displayed.

### v2.23.4
- **Maintenance:** Synchronized all project changelogs and manifests to ensure consistent update tracking for Home Assistant.

### v2.23.3
- **Fix: Warp Link Reliability:** Switched Warp Link to Slot 0 (Auto-save) for universal core compatibility. Added a robust retry loop and explicit virtual-filesystem flushing to ensure saves are fully synced before generating a warp point.
- **Improved UX:** Selection on the dashboard is now locked to clicks only, preventing accidental switching while moving the mouse.

### v2.23.2
- **Warp Link Manual Fallback:** Added a manual Warp Link fallback in case Home Assistant security policies block external QR code images.

### v2.23.1
- **Improved Dashboard UX:** Optimized game selection logic.

### v2.23.0
- **Feature: Warp Link Handoff:** Seamlessly transition gameplay from PC to mobile via QR code scanning.
- **Enhanced Dashboard UX:** Browsing now requires two presses to launch, supporting game inspection.
- **Improved Focus Management:** Full synchronization between keyboard, mouse, and gamepad focus states.

### v2.22.17
- **Fix:** Resolved a `ReferenceError: useRef is not defined` that caused the dashboard to crash.

### v2.22.16
- **Atomic Metadata Imports:** Implemented database transactions for RetroBat XML imports to prevent library corruption.

### v2.22.15
- **Console-Grade Dashboard:** Enabled full physical gamepad navigation for the main dashboard.
- **Micro-UX Touch Controls:** Optimized the on-screen touchpad for mobile devices with haptic feedback.
- **Overscan Safety:** Added CSS safe-area handling to the emulator player.

### v2.22.14
- **Feature: Save State Re-Syncing:** Save states are now permanently linked to the game file's unique hash. If you delete and re-upload the same game, the system will automatically find and re-link your previous save states.

### v2.22.13
- **Feature: Resume from Last Save:** You can now resume your games directly from the dashboard. If a save state exists, a new "Resume" button will appear in the game detail panel.
- **Visual Feedback:** Added a "Latest Save" status card to the game overview.

### v2.22.12
- **Scraper Enhancement:** Improved TheGamesDB matching logic with fuzzy title fallbacks. Descriptions and release dates are now much more likely to populate for existing games.

### v2.22.11
- **Enhanced Mobile Navigation:** Redesigned the system selector bar to include a pinned "Quick Actions" overlay. The Library and Settings icons are now consistently visible and easier to tap, featuring improved contrast and a subtle background gradient to prevent content overlap.

### v2.22.10
- **Fix:** Resolved a `ReferenceError: LayoutGrid is not defined` crashing the mobile dashboard.

### v2.22.9
- **Fix:** Resolved a bug in the BIOS upload logic where incorrect data handling caused uploads to fail with a "toLowerCase" error.

### v2.22.8
- **Mobile UX Improvement:** Added a "Library" icon next to the Settings icon for quicker navigation on mobile devices.

### v2.22.7
- **Mobile Access Fix:** Added a persistent settings icon to the system selector bar, ensuring mobile and tablet users can access the settings panel even when the desktop header is hidden.

### v2.22.6
- **Fix:** Corrected API routing issues for Home Assistant Ingress. Widespread "Not Found" errors in Settings and Game Details are now resolved by correctly resolving the relative base path.

### v2.22.5
- **Fix:** Resolved "bootstrap.js blocked" error on systems requiring a BIOS (PS1, PS2, SegaCD, GBA, etc.).

### v2.22.4
- **Layout Optimization** — Reduced redundant headers and improved vertical spacing on mobile devices for a more compact UI.

### v2.22.3
- **Visual Polish** — Hidden unwanted browser scrollbars for a cleaner "app-like" experience.

### v2.22.2
- **UI Refinement** — Removed the bottom bar and controller hints for a cleaner interface.

### v2.22.1
- **Official Rebranding** — Fully transitioned from PlayHub to **HomeArcade**.

---

## Troubleshooting & FAQ

**Box art isn't showing for my games.**
You need free ScreenScraper credentials. Go to **Settings → Services** and enter your ScreenScraper username and password. Once saved, open any game's detail card and tap **Refresh Art**, or use **Scrape All ROMs** to batch-update your library.

**The emulator shows a blank screen or "Blocked by response" error.**
This is a browser security header conflict common in some Home Assistant setups. HomeArcade explicitly disables COOP/COEP headers to prevent this. If you still see it, try opening HomeArcade in a standalone browser tab instead of the HA sidebar panel.

**My ROM won't launch — I see a red error message.**
Check that the HomeArcade add-on is running in Home Assistant. If it restarted recently, wait 10–15 seconds and try again. For PS1/PS2/GBA/SegaCD games, ensure you have uploaded the correct BIOS file in **Settings → Health**.

**Warp Link QR code fails or says "Warp Failed".**
Make sure you are logged into Home Assistant in your phone's browser before scanning. The warp link contains your HA session — if you're not logged in, it will return a 401 error. Scan the code from within the HA Companion App for best results.

**I uploaded a ROM but it doesn't appear in the library.**
Try pulling down to refresh the page. If it still doesn't appear, check the add-on logs in Home Assistant for upload errors. Very large files (PS2 ISOs) may take a minute to process.

**How do I enable Kiosk Mode?**
Kiosk Mode hides the Settings, History, and Achievements navigation links — ideal for a shared TV or arcade cabinet. Enable it in **Settings → Library** by toggling the Kiosk Mode switch. To exit kiosk mode, navigate directly to `/#/settings` in the browser.

**The sidebar doesn't appear on mobile.**
On mobile, the sidebar is a slide-out panel. Tap the hamburger menu button (☰) at the top of any secondary page (Settings, History, Achievements) to open it.

---

## Links

- [Report a bug](https://github.com/GlerschNersch/token/issues/new)
- [EmulatorJS](https://emulatorjs.org)
- [RetroAchievements](https://retroachievements.org)
- [ScreenScraper](https://www.screenscraper.fr)

## Support

If HomeArcade has been useful to you, a small tip is always appreciated but never expected!

[![Venmo](https://img.shields.io/badge/Venmo-@vincusmalincus-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/vincusmalincus)
