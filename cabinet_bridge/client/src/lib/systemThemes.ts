/**
 * SystemBrandTheme — Iconic Brand Palettes for Retro Gaming Consoles.
 * Used by HomeArcade for Dynamic System Theming:
 * When viewing a specific system or a game belonging to that system,
 * the UI adopts the official visual identity and brand colors of that platform.
 */

export interface SystemBrandTheme {
  id: string;
  brandLabel: string;
  name: string;
  primaryHsl: string;      // HSL string for --primary (e.g., "212 100% 50%")
  accentHsl: string;       // HSL string for --accent (e.g., "185 100% 55%")
  bgDark: string;          // Dark ambient surface color (hex or rgba)
  gradientClass: string;   // Tailwind gradient utility for hero buttons/banners
  badgeClass: string;      // Tailwind classes for system badge
  glowRgba: string;        // RGBA string for glowing shadows
  accentDotColor: string;  // Hex for indicator dot
}

export const SYSTEM_BRAND_THEMES: Record<string, SystemBrandTheme> = {
  // Sony PlayStation 1
  ps1: {
    id: "ps1",
    brandLabel: "Sony PlayStation",
    name: "PlayStation",
    primaryHsl: "212 100% 52%",      // Sony Sapphire Blue
    accentHsl: "185 100% 55%",       // PlayStation Electric Cyan
    bgDark: "#040918",
    gradientClass: "from-blue-700 via-indigo-600 to-cyan-500",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(37,99,235,0.3)]",
    glowRgba: "rgba(37, 99, 235, 0.45)",
    accentDotColor: "#38bdf8",
  },
  // Sony PlayStation 2
  ps2: {
    id: "ps2",
    brandLabel: "Sony PlayStation 2",
    name: "PlayStation 2",
    primaryHsl: "218 95% 55%",       // PS2 Monolith Blue
    accentHsl: "190 95% 50%",
    bgDark: "#030612",
    gradientClass: "from-blue-800 via-blue-600 to-cyan-400",
    badgeClass: "bg-blue-600/20 text-blue-300 border-blue-500/40",
    glowRgba: "rgba(30, 64, 175, 0.45)",
    accentDotColor: "#60a5fa",
  },
  // Sony PSP
  psp: {
    id: "psp",
    brandLabel: "PlayStation Portable",
    name: "PSP",
    primaryHsl: "205 90% 54%",
    accentHsl: "175 90% 50%",
    bgDark: "#030814",
    gradientClass: "from-sky-700 to-indigo-600",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    glowRgba: "rgba(14, 165, 233, 0.4)",
    accentDotColor: "#38bdf8",
  },
  // Nintendo Super Nintendo (SNES)
  snes: {
    id: "snes",
    brandLabel: "Super Nintendo",
    name: "SNES",
    primaryHsl: "265 85% 65%",       // SNES Lilac / US Purple
    accentHsl: "145 90% 45%",        // Super Famicom Emerald Green
    bgDark: "#0d0617",
    gradientClass: "from-purple-600 via-violet-600 to-emerald-500",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    glowRgba: "rgba(168, 85, 247, 0.45)",
    accentDotColor: "#a855f7",
  },
  // Nintendo Entertainment System (NES)
  nes: {
    id: "nes",
    brandLabel: "Nintendo NES",
    name: "NES",
    primaryHsl: "355 88% 54%",       // Classic Nintendo Red
    accentHsl: "45 95% 52%",         // Famicom Gold / Yellow
    bgDark: "#120507",
    gradientClass: "from-red-600 via-rose-600 to-amber-500",
    badgeClass: "bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]",
    glowRgba: "rgba(239, 68, 68, 0.45)",
    accentDotColor: "#ef4444",
  },
  // Nintendo 64
  n64: {
    id: "n64",
    brandLabel: "Nintendo 64",
    name: "Nintendo 64",
    primaryHsl: "145 85% 44%",       // N64 3D Green
    accentHsl: "355 85% 55%",        // N64 Red
    bgDark: "#051109",
    gradientClass: "from-emerald-600 via-teal-600 to-rose-500",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    glowRgba: "rgba(16, 185, 129, 0.45)",
    accentDotColor: "#10b981",
  },
  // Nintendo Game Boy Advance (GBA)
  gba: {
    id: "gba",
    brandLabel: "Game Boy Advance",
    name: "GBA",
    primaryHsl: "260 82% 64%",       // GBA Indigo Violet
    accentHsl: "175 92% 48%",        // GBA Cyan / Arctic
    bgDark: "#0c051a",
    gradientClass: "from-indigo-600 via-purple-600 to-teal-400",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]",
    glowRgba: "rgba(99, 102, 241, 0.45)",
    accentDotColor: "#818cf8",
  },
  // Nintendo Game Boy (Original)
  gb: {
    id: "gb",
    brandLabel: "Nintendo Game Boy",
    name: "Game Boy",
    primaryHsl: "82 65% 42%",        // Dot Matrix Pea Soup Olive
    accentHsl: "65 80% 50%",
    bgDark: "#0b1006",
    gradientClass: "from-lime-700 via-emerald-700 to-yellow-500",
    badgeClass: "bg-lime-500/20 text-lime-300 border-lime-500/40",
    glowRgba: "rgba(132, 204, 22, 0.4)",
    accentDotColor: "#84cc16",
  },
  // Nintendo Game Boy Color
  gbc: {
    id: "gbc",
    brandLabel: "Game Boy Color",
    name: "GBC",
    primaryHsl: "320 85% 58%",       // Atomic Purple / Berry
    accentHsl: "185 90% 50%",        // Teal
    bgDark: "#140412",
    gradientClass: "from-fuchsia-600 via-pink-600 to-cyan-400",
    badgeClass: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
    glowRgba: "rgba(217, 70, 239, 0.45)",
    accentDotColor: "#d946ef",
  },
  // Nintendo DS
  nds: {
    id: "nds",
    brandLabel: "Nintendo DS",
    name: "Nintendo DS",
    primaryHsl: "210 25% 70%",       // Platinum Silver
    accentHsl: "205 90% 55%",        // Touch Blue
    bgDark: "#080c14",
    gradientClass: "from-slate-600 via-sky-600 to-indigo-500",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    glowRgba: "rgba(56, 189, 248, 0.4)",
    accentDotColor: "#38bdf8",
  },
  // Sega Genesis / Mega Drive
  genesis: {
    id: "genesis",
    brandLabel: "Sega Genesis",
    name: "Genesis / Mega Drive",
    primaryHsl: "210 100% 50%",      // Sonic Electric Blue
    accentHsl: "185 100% 55%",       // Blast Processing Cyan
    bgDark: "#020714",
    gradientClass: "from-blue-600 via-indigo-600 to-cyan-400",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    glowRgba: "rgba(59, 130, 246, 0.45)",
    accentDotColor: "#3b82f6",
  },
  // Sega Dreamcast
  dreamcast: {
    id: "dreamcast",
    brandLabel: "Sega Dreamcast",
    name: "Dreamcast",
    primaryHsl: "25 100% 52%",       // Swirl Blaze Orange
    accentHsl: "200 100% 55%",       // Arctic Blue
    bgDark: "#140803",
    gradientClass: "from-orange-600 via-amber-600 to-sky-400",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.35)]",
    glowRgba: "rgba(249, 115, 22, 0.45)",
    accentDotColor: "#f97316",
  },
  // Sega Saturn
  saturn: {
    id: "saturn",
    brandLabel: "Sega Saturn",
    name: "Saturn",
    primaryHsl: "270 70% 58%",       // Cosmic Purple
    accentHsl: "45 95% 55%",         // Ring Gold
    bgDark: "#0c0517",
    gradientClass: "from-purple-700 via-indigo-600 to-amber-400",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    glowRgba: "rgba(147, 51, 234, 0.4)",
    accentDotColor: "#a855f7",
  },
  // Sega Master System
  sms: {
    id: "sms",
    brandLabel: "Sega Master System",
    name: "Master System",
    primaryHsl: "200 85% 48%",
    accentHsl: "355 85% 55%",
    bgDark: "#050d17",
    gradientClass: "from-sky-700 via-blue-600 to-rose-500",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    glowRgba: "rgba(2, 132, 199, 0.4)",
    accentDotColor: "#0284c7",
  },
  // Arcade / MAME / Neo-Geo
  arcade: {
    id: "arcade",
    brandLabel: "Coin-Op Arcade",
    name: "Arcade Cab",
    primaryHsl: "42 100% 52%",       // Neo-Geo Max 330 Gold
    accentHsl: "350 90% 55%",        // Cabinet Red
    bgDark: "#140c03",
    gradientClass: "from-amber-600 via-yellow-600 to-red-500",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
    glowRgba: "rgba(245, 158, 11, 0.45)",
    accentDotColor: "#f59e0b",
  },
  // SNK Neo Geo
  neogeo: {
    id: "neogeo",
    brandLabel: "SNK Neo Geo",
    name: "Neo Geo",
    primaryHsl: "45 100% 50%",
    accentHsl: "0 85% 55%",
    bgDark: "#140a02",
    gradientClass: "from-amber-500 via-red-600 to-yellow-400",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    glowRgba: "rgba(245, 158, 11, 0.45)",
    accentDotColor: "#eab308",
  },
  // Atari 2600
  atari2600: {
    id: "atari2600",
    brandLabel: "Atari 2600",
    name: "Atari 2600",
    primaryHsl: "28 92% 48%",        // Vintage Woodgrain Amber
    accentHsl: "40 95% 52%",
    bgDark: "#120703",
    gradientClass: "from-amber-700 via-orange-600 to-yellow-500",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    glowRgba: "rgba(234, 88, 12, 0.4)",
    accentDotColor: "#ea580c",
  },
  // PC Engine / TurboGrafx-16
  pce: {
    id: "pce",
    brandLabel: "TurboGrafx-16",
    name: "PC Engine",
    primaryHsl: "24 100% 52%",       // TurboGrafx Orange
    accentHsl: "205 90% 50%",
    bgDark: "#140602",
    gradientClass: "from-orange-600 via-rose-600 to-cyan-500",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    glowRgba: "rgba(249, 115, 22, 0.4)",
    accentDotColor: "#f97316",
  },
};

// Global default theme (when no specific system is selected)
export const DEFAULT_GLOBAL_THEME: SystemBrandTheme = {
  id: "global",
  brandLabel: "HomeArcade Global",
  name: "HomeArcade",
  primaryHsl: "322 92% 60%",         // Neon Magenta/Purple
  accentHsl: "188 90% 60%",          // Phosphor Cyan
  bgDark: "#08080d",
  gradientClass: "from-purple-600 via-indigo-600 to-cyan-400",
  badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]",
  glowRgba: "rgba(168, 85, 247, 0.35)",
  accentDotColor: "#c084fc",
};

/**
 * Returns the SystemBrandTheme for a given system ID, or the global default theme.
 */
export function getSystemBrandTheme(systemId: string | null | undefined): SystemBrandTheme {
  if (!systemId) return DEFAULT_GLOBAL_THEME;
  const normalized = systemId.toLowerCase().trim();
  return SYSTEM_BRAND_THEMES[normalized] ?? DEFAULT_GLOBAL_THEME;
}
