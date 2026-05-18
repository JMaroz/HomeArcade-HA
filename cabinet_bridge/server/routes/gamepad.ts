import type { Express } from "express";

interface AutoconfigMatch {
  name: string;
  path: string;
  score: number;
}

// ── Known good mappings for controllers that don't match by name ─────────────
const KNOWN_CONTROLLERS: Record<string, {
  vid: string;
  pid: string;
  configPath: string;
}> = {
  "Xbox Series Controller": {
    vid: "045e",
    pid: "0b00",
    configPath: "xinput/XBOX Series Controller.cfg",
  },
  "Xbox One Controller": {
    vid: "045e",
    pid: "0b00",
    configPath: "xinput/Xbox_One_Controller.cfg",
  },
};

export function registerGamepadRoutes(app: Express) {
  /**
   * Search for a gamepad autoconfig file based on the browser's Gamepad ID.
   *
   * Example ID: "045e:0b00 Microsoft Xbox Series Controller"
   */
  app.get("/api/gamepad/autoconfig", async (req, res) => {
    const gamepadId = req.query.id as string;
    if (!gamepadId) return res.status(400).json({ message: "Gamepad ID required." });

    try {
      // ── 1. Extract VID + PID ─────────────────────────────────────────────
      // Browser Gamepad IDs look like: "045e:0b00 Microsoft Xbox Series Controller"
      const vidPidMatch = gamepadId.match(/^([0-9a-f]{4}):([0-9a-f]{4})/i);
      const vid = vidPidMatch ? vidPidMatch[1].toLowerCase() : null;
      const pid = vidPidMatch ? vidPidMatch[2].toLowerCase() : null;

      // ── 2. Check known controllers ─────────────────────────────────────
      const cleanName = gamepadId.replace(/^[^ ]+ /, "").trim();
      for (const [, info] of Object.entries(KNOWN_CONTROLLERS)) {
        if (vid === info.vid && pid === info.pid) {
          const rawUrl = `https://raw.githubusercontent.com/libretro/retroarch-joypad-autoconfig/master/${info.configPath}`;
          const rawRes = await fetch(rawUrl, {
            headers: { "User-Agent": "HomeArcade/1.0", "Accept": "application/vnd.github+json" },
          });
          if (rawRes.ok) {
            const text = await rawRes.text();
            const config: Record<string, string> = {};
            text.split("\n").forEach((line) => {
              const m = line.match(/^([^=\s]+)\s*=\s*"?([^"\n]+)"?/);
              if (m) config[m[1]] = m[2];
            });
            return res.json({ source: info.configPath.split("/")[1], mapping: config });
          }
        }
      }

      // ── 3. Search RetroArch autoconfig repo by name ─────────────────────
      const drivers = ["xinput", "dinput", "udev", "sdl2"];
      let bestMatch: AutoconfigMatch | null = null;
      const searchName = cleanName.toLowerCase();

      for (const driver of drivers) {
        const indexUrl = `https://api.github.com/repos/libretro/retroarch-joypad-autoconfig/contents/${driver}?ref=master`;
        const response = await fetch(indexUrl, {
          headers: { "Accept": "application/vnd.github+json", "User-Agent": "HomeArcade/1.0" },
        });
        if (!response.ok) continue;

        const files = await response.json() as { name: string; path: string }[];

        for (const file of files) {
          if (!file.name.endsWith(".cfg")) continue;
          const baseName = file.name.replace(".cfg", "").toLowerCase();

          let score = 0;
          const target = searchName;
          if (target.startsWith(baseName)) score = 100;
          else if (baseName.startsWith(target)) score = 90;
          else if (target.includes(baseName)) score = 60;
          else if (baseName.includes(target)) score = 50;

          if (score > (bestMatch?.score || 0)) {
            bestMatch = { name: file.name, path: file.path, score };
          }
        }
      }

      if (!bestMatch) {
        return res.status(404).json({ message: "No autoconfig found for this controller." });
      }

      // ── 4. Download and parse the matched config ─────────────────────────
      const rawUrl = `https://raw.githubusercontent.com/libretro/retroarch-joypad-autoconfig/master/${bestMatch.path}`;
      const rawRes = await fetch(rawUrl, {
        headers: { "User-Agent": "HomeArcade/1.0", "Accept": "application/vnd.github+json" },
      });
      if (!rawRes.ok) return res.status(500).json({ message: "Failed to download config file." });

      const text = await rawRes.text();
      const config: Record<string, string> = {};
      text.split("\n").forEach((line) => {
        const m = line.match(/^([^=\s]+)\s*=\s*"?([^"\n]+)"?/);
        if (m) config[m[1]] = m[2];
      });

      res.json({ source: bestMatch.name, mapping: config });

    } catch (error) {
      console.error("[Gamepad] Autoconfig error:", error);
      res.status(500).json({ message: "Search failed." });
    }
  });
}