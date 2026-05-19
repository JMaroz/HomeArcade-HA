/**
 * KyleBing retro-console PNG icon for a given system.
 *
 * Renders the icon fetched through our same-origin /api/system-logos/:id
 * proxy (caches to disk, falls back through SteamGridDB → libretro chain).
 * Shows nothing on error — callers handle the empty-state if needed.
 *
 * The icon is inverted white (filter: brightness(0) invert(1)) to match
 * the monochrome aesthetic, and sized to fit within its container.
 *
 * Source: https://github.com/KyleBing/retro-game-console-icons
 * License: CC-BY-NC-4.0 — attribution required in production use.
 */
import { useState } from "react";
import { apiUrl } from "@/lib/queryClient";

interface KyleBingIconProps {
  systemId: string;
  /** Additional CSS classes applied to the inner <img>. */
  className?: string;
}

export function KyleBingIcon({ systemId, className = "" }: KyleBingIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={apiUrl(`/api/system-logos/${systemId}`)}
      alt=""
      className={className}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        filter: "brightness(0) invert(1)",
      }}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}