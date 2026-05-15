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
] as const;

export type AppTheme = (typeof THEMES)[number];

export function applyTheme(theme: AppTheme) {
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  localStorage.setItem("ha-theme", theme);
}
