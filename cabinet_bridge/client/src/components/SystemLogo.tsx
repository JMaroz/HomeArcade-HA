import { useState } from "react";
import { ConsoleSilhouette } from "@/components/ConsoleSilhouette";

/**
 * Official system logo, loaded from Wikimedia Commons via the stable
 * Special:FilePath redirect (no hash path needed). Rendered white via
 * CSS filter so it reads cleanly on any gradient. Falls back to the
 * ConsoleSilhouette if the image fails to load (e.g. offline).
 */

// Wikimedia Commons Special:FilePath URLs — stable canonical redirects
const LOGOS: Partial<Record<string, string>> = {
  nes:       "https://commons.wikimedia.org/wiki/Special:FilePath/NES-logo.svg",
  snes:      "https://commons.wikimedia.org/wiki/Special:FilePath/Super_Nintendo_Entertainment_System_logo.svg",
  n64:       "https://commons.wikimedia.org/wiki/Special:FilePath/Nintendo_64_logo.svg",
  gba:       "https://commons.wikimedia.org/wiki/Special:FilePath/Game_Boy_Advance_logo.svg",
  genesis:   "https://commons.wikimedia.org/wiki/Special:FilePath/Sega-Genesis-Logo.svg",
  ps1:       "https://commons.wikimedia.org/wiki/Special:FilePath/PlayStation_Logo.svg",
  ps2:       "https://commons.wikimedia.org/wiki/Special:FilePath/PlayStation_2_logo.svg",
  psp:       "https://commons.wikimedia.org/wiki/Special:FilePath/PlayStation_Portable_logo.svg",
  dreamcast: "https://commons.wikimedia.org/wiki/Special:FilePath/Dreamcast_logo.svg",
  gb:        "https://commons.wikimedia.org/wiki/Special:FilePath/Game_Boy_logo.svg",
  gbc:       "https://commons.wikimedia.org/wiki/Special:FilePath/Game_Boy_Color_logo.svg",
  nds:       "https://commons.wikimedia.org/wiki/Special:FilePath/Nintendo_DS_Logo.svg",
  psp2:      "https://commons.wikimedia.org/wiki/Special:FilePath/PlayStation_Portable_logo.svg",
};

export function SystemLogo({ systemId }: { systemId: string }) {
  const [failed, setFailed] = useState(false);
  const url = LOGOS[systemId];

  if (!url || failed) {
    return <ConsoleSilhouette systemId={systemId} />;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <img
        src={url}
        alt=""
        className="w-full h-full object-contain"
        style={{
          filter: "brightness(0) invert(1)",
          opacity: 0.85,
          // drop-shadow for depth against the gradient
          WebkitFilter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
        }}
        loading="lazy"
        onError={() => setFailed(true)}
        crossOrigin="anonymous"
      />
    </div>
  );
}
