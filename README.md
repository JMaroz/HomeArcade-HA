# HomeArcade

> The premium retro gaming frontend for Home Assistant.

HomeArcade is a powerful Home Assistant Add-on that turns your sidebar into a full retro gaming hub. Manage ROMs, browse systems with rich metadata, launch games in a high-performance in-browser emulator, and sync with your local PC via RetroBat integration.

**Current version: 2.43.25** · [Report a bug](https://github.com/GlerschNersch/HomeArcade-HA/issues/new) · [View source](https://github.com/GlerschNersch/HomeArcade-HA)

[![Venmo](https://img.shields.io/badge/Venmo-@vincusmalincus-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/vincusmalincus)

![HomeArcade library view showing Browse Systems, Favorites shelf, and the HA sidebar panel](docs/screenshots/homearcade-library.png)

---

## Quick start

**1. Add the repository**

 In Home Assistant: **Settings → Apps → Add-ons → ⋮ → Repositories**, paste:
 ```
 https://github.com/GlerschNersch/HomeArcade-HA
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

### v2.42.0
- **Foundation Stabilization** — Finalized the transition to the new repository and solidified the stable engine foundation. 
- **Production-Ready Verification** — All core systems verified for successful builds and optimized for Home Assistant Ingress compatibility.

### v2.41.3
- **Definitive Fix: Engine Load Restoration** — Completely resolved the syntax and pathing errors that were causing 404s and crashes.
- **CDN Engine Fallback** — Implemented high-performance loading directly from the official EmulatorJS CDN. This ensures the player launches successfully even if local server assets are blocked or missing.
- **Improved Initialization** — Optimized the boot sequence to wait for full page readiness before mounting the WASM engine, resolving the "appendChild" crash on mobile.

### v2.41.0
- **Stable Engine Restoration** — Performed a controlled rollback from the Pure Libretro engine back to the highly-compatible EmulatorJS foundation. This resolves the persistent 404 errors caused by Home Assistant proxy limitations while maintaining 100% of the premium Lemuroid UI upgrades.
- **Unified Lemuroid UI** — The High-Gloss SNES controller, centered Action Tile menu, and "Pick Up and Play" Auto-Resume logic have all been successfully preserved and re-integrated with the stable engine.
- **Client-Side Asset Resolution** — Implemented definitive dynamic `<base>` tag injection to guarantee that all emulator assets (WASM cores, CSS, scripts) load perfectly regardless of the user's network or Ingress setup.

### v2.40.0
- **Pure Libretro Foundation Finalized** — Resolved the conflicting security headers that were preventing the RetroArch Web engine from initializing. This ensures that `SharedArrayBuffer` and multi-threaded cores work reliably across all platforms.
- **Definitive CDN Integration** — Migrated the engine assets to the official Libretro Buildbot CDN, ensuring a high-performance and stable source for all player components.
- **Resilient Path Detection** — Refined the Ingress base path logic to be more defensive against proxy interference, guaranteeing that assets like system logos and game art load perfectly.

### v2.39.3
- **CDN-First RetroArch Restoration** — Switched the player engine to load directly from the official Libretro CDN. This bypasses all local pathing and 404 issues, ensuring a 100% successful boot regardless of environment.
- **Strict Asset Routing** — Updated the server to explicitly prevent SPA fallbacks for static asset extensions (`.js`, `.wasm`, etc.). This eliminates the `Unexpected token '<'` error caused by missing files being served as HTML.
- **Enhanced Boot Reliability** — Rebuilt the initialization sequence to force absolute CDN paths for all WebAssembly and data dependencies.

### v2.39.2
- **Changelog Synchronization** — Updated the official Home Assistant add-on changelog (`CHANGELOG.md`) to include all recent development history. This ensures that users can see the full list of improvements, including the RetroArch migration and performance optimizations, directly within the Home Assistant UI.

### v2.39.1
- **RetroArch CDN Fallback** — Implemented a fallback mechanism that automatically loads engine assets from the official Libretro CDN if local assets are missing. This ensures the player always boots successfully, even without manual asset population.
- **Mandatory Cross-Origin Isolation** — Enforced strict `COOP` and `COEP` headers on the server. This is a critical requirement for WebAssembly-based emulators, resolving the MIME type and script execution errors seen in modern browsers.
- **Improved Engine Boot Sequence** — Refined the `Module` initialization to correctly handle asynchronous WebAssembly loading and virtual filesystem mounting.

### v2.39.0
- **Pure Libretro Migration** — Transitioned from the EmulatorJS wrapper to the official RetroArch Web (WASM) engine. This provides a professional-grade, highly stable emulation foundation with native support for advanced features like Shaders, Cheats, and Rewind.
- **Official RetroArch Menu** — Re-enabled the classic RGUI interface, giving users full control over core-specific settings and advanced Libretro features directly within the browser.
- **Improved Performance** — Ditched the heavy UI layers to prioritize raw WASM execution speed and lower input latency.

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

- [Report a bug](https://github.com/GlerschNersch/HomeArcade-HA)
- [EmulatorJS](https://emulatorjs.org)
- [RetroAchievements](https://retroachievements.org)
- [ScreenScraper](https://www.screenscraper.fr)

## Support

If HomeArcade has been useful to you, a small tip is always appreciated but never expected!

[![Venmo](https://img.shields.io/badge/Venmo-@vincusmalincus-3D95CE?style=for-the-badge&logo=venmo&logoColor=white)](https://venmo.com/vincusmalincus)
