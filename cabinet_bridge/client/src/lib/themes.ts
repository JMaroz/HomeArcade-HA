export const THEMES = [
  "default",
  "synthwave",
  "gameboy",
  "oled",
  "nord",
  "amber",
  "dracula",
  "cyberpunk",
  "miami-vice",
  "c64",
  "arcade",
  "vaporwave",
  "grunge",
  "win95",
  "blockbuster",
  "aqua",
  "y2k",
  "halo",
  "snes",
  "ps1",
  "matrix",
  "cherry-blossom",
  "terminal",
  "bloodmoon",
  "deep-sea",
  "golden-age",
] as const;

export type AppTheme = (typeof THEMES)[number];

export interface ThemeMeta {
  id: AppTheme;
  label: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  description: string;
}

export const THEME_METADATA: Record<AppTheme, ThemeMeta> = {
  default: {
    id: "default",
    label: "Cyber-Arcade",
    primaryColor: "#d926a9",
    accentColor: "#06b6d4",
    bgColor: "#08080d",
    description: "Default dark arcade with neon magenta and cyan highlights",
  },
  synthwave: {
    id: "synthwave",
    label: "Synthwave",
    primaryColor: "#f43f5e",
    accentColor: "#06b6d4",
    bgColor: "#120326",
    description: "80s retro-future grid with hot pink and sunset cyan",
  },
  gameboy: {
    id: "gameboy",
    label: "Game Boy",
    primaryColor: "#84cc16",
    accentColor: "#4d7c0f",
    bgColor: "#141c09",
    description: "Original 1989 dot-matrix green pea soup monochrome",
  },
  oled: {
    id: "oled",
    label: "OLED Pitch Black",
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    bgColor: "#000000",
    description: "Zero background emission for battery savings and pure contrast",
  },
  nord: {
    id: "nord",
    label: "Nord Arctic",
    primaryColor: "#88c0d0",
    accentColor: "#81a1c1",
    bgColor: "#2e3440",
    description: "Clean Arctic palette inspired by icy Scandinavian landscapes",
  },
  amber: {
    id: "amber",
    label: "Amber CRT",
    primaryColor: "#f59e0b",
    accentColor: "#d97706",
    bgColor: "#170d02",
    description: "Warm phosphor glow of early 80s monochrome monitors",
  },
  dracula: {
    id: "dracula",
    label: "Dracula",
    primaryColor: "#bd93f9",
    accentColor: "#8be9fd",
    bgColor: "#282a36",
    description: "Gothic dark palette with vivid lavender and cyan accents",
  },
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyberpunk 2077",
    primaryColor: "#facc15",
    accentColor: "#06b6d4",
    bgColor: "#0a0a0f",
    description: "High-contrast neon yellow and cyan from Night City",
  },
  "miami-vice": {
    id: "miami-vice",
    label: "Miami Vice",
    primaryColor: "#ec4899",
    accentColor: "#14b8a6",
    bgColor: "#0f172a",
    description: "Pastel neon pink and turquoise sunset vibes",
  },
  c64: {
    id: "c64",
    label: "Commodore 64",
    primaryColor: "#4040e0",
    accentColor: "#8080ff",
    bgColor: "#282860",
    description: "Authentic 16-color palette from the iconic 8-bit micro",
  },
  arcade: {
    id: "arcade",
    label: "Arcade Cab",
    primaryColor: "#f59e0b",
    accentColor: "#ef4444",
    bgColor: "#0d0905",
    description: "Warm gold and crimson glow of classic arcade marquees",
  },
  vaporwave: {
    id: "vaporwave",
    label: "Vaporwave",
    primaryColor: "#f472b6",
    accentColor: "#a78bfa",
    bgColor: "#1e1b4b",
    description: "Dreamy nostalgic aesthetics of pastel pink and lavender",
  },
  grunge: {
    id: "grunge",
    label: "90s Grunge",
    primaryColor: "#b45309",
    accentColor: "#64748b",
    bgColor: "#18181b",
    description: "Industrial rust, distressed metals and raw concrete",
  },
  win95: {
    id: "win95",
    label: "Windows 95",
    primaryColor: "#008080",
    accentColor: "#000080",
    bgColor: "#202830",
    description: "Teal wallpaper, navy titlebars and retro 3D buttons",
  },
  blockbuster: {
    id: "blockbuster",
    label: "Blockbuster VHS",
    primaryColor: "#2563eb",
    accentColor: "#eab308",
    bgColor: "#0f172a",
    description: "Iconic blue and bright yellow tape rental palette",
  },
  aqua: {
    id: "aqua",
    label: "Y2K Aqua",
    primaryColor: "#06b6d4",
    accentColor: "#38bdf8",
    bgColor: "#091424",
    description: "Translucent crystal blues and smooth glossy highlights",
  },
  y2k: {
    id: "y2k",
    label: "Y2K Future",
    primaryColor: "#a3e635",
    accentColor: "#94a3b8",
    bgColor: "#09090b",
    description: "Silver chrome and radioactive lime from early 2000s tech",
  },
  halo: {
    id: "halo",
    label: "Spartan Halo",
    primaryColor: "#65a30d",
    accentColor: "#eab308",
    bgColor: "#1c1917",
    description: "Mjolnir armor green with golden visor reflections",
  },
  snes: {
    id: "snes",
    label: "SNES Classic",
    primaryColor: "#c084fc",
    accentColor: "#10b981",
    bgColor: "#140e1f",
    description: "Lilac and violet tones paired with Super Famicom colors",
  },
  ps1: {
    id: "ps1",
    label: "PlayStation Heritage",
    primaryColor: "#2563eb",
    accentColor: "#38bdf8",
    bgColor: "#050914",
    description: "Classic Sony sapphire blue and midnight navy backdrop",
  },
  matrix: {
    id: "matrix",
    label: "The Matrix",
    primaryColor: "#22c55e",
    accentColor: "#4ade80",
    bgColor: "#020b05",
    description: "Cascading digital rain green code on deep obsidian",
  },
  "cherry-blossom": {
    id: "cherry-blossom",
    label: "Cherry Blossom",
    primaryColor: "#f472b6",
    accentColor: "#fb7185",
    bgColor: "#180914",
    description: "Sakura petal soft pinks over midnight plum",
  },
  terminal: {
    id: "terminal",
    label: "Terminal Green",
    primaryColor: "#10b981",
    accentColor: "#34d399",
    bgColor: "#030a06",
    description: "Crisp VT220 green phosphorus text on black glass",
  },
  bloodmoon: {
    id: "bloodmoon",
    label: "Blood Moon",
    primaryColor: "#dc2626",
    accentColor: "#f97316",
    bgColor: "#140303",
    description: "Fiery eclipse crimson and burning embers",
  },
  "deep-sea": {
    id: "deep-sea",
    label: "Abyssal Deep Sea",
    primaryColor: "#0284c7",
    accentColor: "#14b8a6",
    bgColor: "#020813",
    description: "Bioluminescent marine cyan deep in the ocean trench",
  },
  "golden-age": {
    id: "golden-age",
    label: "Golden Age",
    primaryColor: "#d97706",
    accentColor: "#f59e0b",
    bgColor: "#140b04",
    description: "Polished brass and warm mahogany of luxury arcade parlors",
  },
};

export function applyTheme(theme: AppTheme) {
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    if (typeof localStorage !== "undefined" && localStorage.setItem) {
      localStorage.setItem("ha-theme", theme);
    }
  } catch {}
}
