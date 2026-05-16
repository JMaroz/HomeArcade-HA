# Changelog

All notable changes to HomeArcade are documented here.

---

## [1.6.1] — 2026-05-15

### Major: Super-Stable Hybrid Release

- **Hybrid Architecture** — Combines the fast, reliable v1.2.0 UI (Dashboard & Home) with the hardened v1.5.4 backend infrastructure. This ensures the app looks the way you like while being immune to the crashes seen in previous versions.
- **Explicit Boot Sequence** — The server now initializes the database in a slow, controlled sequence with comprehensive diagnostic logging. This resolves race conditions and silent boot failures on AMD64 hardware.
- **Permanent Ingress Fix** — Standardized on strict relative pathing (`base: "./"`) and process-level static asset resolution. This is the definitive fix for the "white screen" and asset loading errors behind Home Assistant.
- **Zero-Memory PS2 Support** — Re-integrated the streaming upload engine. Large PS2 ISOs (up to 8GB) are now streamed directly to disk, completely bypassing the memory exhaustion crashes.
- **Syntax Correction** — Manually identified and fixed a latent JSX tag mismatch in the Dashboard that was present in the original v1.2.0 commit.

---

## [1.2.0] — 2026-05-15

### Major: Professional Shadcn Navigation

- **Persistent Sidebar** — Migrated the custom navigation to the professional Shadcn UI Sidebar foundation.
- **Collapsible Mode** — Added support for "Icon Mode" (collapsing the sidebar to icons only), providing extra screen space for game grids.
- **Keyboard Shortcuts** — Integrated native keyboard support (Cmd+B / Ctrl+B) to toggle the sidebar instantly.

---

## [1.1.19] — 2026-05-15
