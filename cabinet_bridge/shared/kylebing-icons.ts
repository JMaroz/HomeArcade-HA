/**
 * KyleBing retro-console-icon mappings.
 * Maps our `SystemId` → KyleBing series_trimui/300w@1x/ icon filename.
 *
 * Source:  https://github.com/KyleBing/retro-game-console-icons
 * License: GPL-3.0 (source) / CC-BY-NC-4.0 (icons)
 *         We use runtime fetch so only the running app needs to comply.
 *         Attribution required — see sourceUrl in system-images.ts.
 *
 * Systems with no KyleBing icon fall back to their existing treatment
 * (gradient + ConsoleSilhouette watermark, or whatever the tile uses).
 */

export const KYLEBING_ICON_MAP: Record<string, string> = {
  // ── Direct name matches ────────────────────────────────────────────────
  arcade:      "ARCADE",
  atari2600:   "ATARI2600",
  atari7800:   "ATARI7800",
  gb:          "GB",
  gbc:         "GBC",
  gba:         "GBA",
  genesis:     "MD",
  lynx:        "LYNX",
  n64:         "N64",
  nds:         "NDS",
  neogeo:      "NEOGEO",
  pce:         "PCE",
  psp:         "PSP",
  saturn:      "SATURN",
  snes:        "SFC",
  gamegear:    "GG",
  virtualboy:  "VB",

  // ── Variants / synonyms ────────────────────────────────────────────────
  sms:         "MS",       // Sega Master System — MS = Master System
  sega32x:     "SEGA32X",
  segacd:      "SEGACD",
  dreamcast:   "DC",
  ps1:         "PS",
  ps2:         "PS",

  // ── Fallbacks for systems not in KyleBing set ─────────────────────────
  // These use whatever their existing tile treatment is (gradient + silhouette).
  // Listed for completeness; intentionally returns undefined.
  // arcade:    — already covered
  // atari5200: — not in our SYSTEMS list
  // atari800:  — not in our SYSTEMS list
  // c64:       — not in our SYSTEMS list
  // And so on.
};

/**
 * Returns the KyleBing icon filename for a given system id, or undefined
 * if no mapping exists.
 */
export function kyleBingIconName(systemId: string): string | undefined {
  return KYLEBING_ICON_MAP[systemId];
}

/**
 * Returns the raw GitHub URL for a KyleBing icon (300w@1x series).
 * Use this for the /api/system-logos proxy which adds caching headers.
 *
 * @param iconName - e.g. "ATARI2600" (without .png extension)
 */
export function kyleBingIconRawUrl(iconName: string): string {
  return `https://raw.githubusercontent.com/KyleBing/retro-game-console-icons/master/series_trimui/300w@1x/${iconName}.png`;
}