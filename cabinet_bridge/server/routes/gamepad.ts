import type { Express } from "express";

interface AutoconfigMatch {
  name: string;
  path: string;
  score: number;
}

export function registerGamepadRoutes(app: Express) {
  /**
   * Search for a gamepad autoconfig file based on the browser's Gamepad ID.
   * 
   * Example ID: "054c:09cc Sony Interactive Entertainment DualShock 4"
   */
  app.get("/api/gamepad/autoconfig", async (req, res) => {
    const gamepadId = req.query.id as string;
    if (!gamepadId) return res.status(400).json({ message: "Gamepad ID required." });

    try {
      // 1. Extract Vendor and Product IDs from the string if possible
      // Browser IDs often contain these in hex format
      const vidMatch = gamepadId.match(/vendor:?\s*([0-9a-f]{4})/i);
      const pidMatch = gamepadId.match(/product:?\s*([0-9a-f]{4})/i);
      
      const vid = vidMatch ? parseInt(vidMatch[1], 16).toString() : null;
      const pid = pidMatch ? parseInt(pidMatch[1], 16).toString() : null;

      // 2. Fetch the autoconfig index (caching would be better here in a real app)
      // For now, let's search common directories: udev, xinput, dinput, sdl2
      const drivers = ["udev", "xinput", "dinput", "sdl2", "android", "hid"];
      let bestMatch: AutoconfigMatch | null = null;

      for (const driver of drivers) {
        const indexUrl = `https://api.github.com/repos/libretro/retroarch-joypad-autoconfig/contents/${driver}`;
        const response = await fetch(indexUrl, {
          headers: { "Accept": "application/vnd.github+json", "User-Agent": "HomeArcade/1.0" }
        });

        if (!response.ok) continue;

        const files = await response.json() as { name: string; path: string }[];
        
        for (const file of files) {
          if (!file.name.endsWith(".cfg")) continue;

          // Simple name matching for now
          const cleanName = file.name.replace(".cfg", "").replace(/-/g, " ").toLowerCase();
          const cleanInput = gamepadId.toLowerCase();

          let score = 0;
          if (cleanInput.includes(cleanName)) score += 50;
          
          // In a real implementation, we would download each file and check VID/PID
          // but that's too many network calls. Instead, we'll try a fast-pass with name matching.
          
          if (score > (bestMatch?.score || 0)) {
            bestMatch = { name: file.name, path: file.path, score };
          }
        }
      }

      if (!bestMatch) return res.status(404).json({ message: "No autoconfig found for this controller." });

      // 3. Download and parse the best match
      const rawUrl = `https://raw.githubusercontent.com/libretro/retroarch-joypad-autoconfig/master/${bestMatch.path}`;
      const rawRes = await fetch(rawUrl);
      if (!rawRes.ok) return res.status(500).json({ message: "Failed to download config file." });

      const text = await rawRes.text();
      const config: Record<string, string> = {};
      
      text.split("\n").forEach(line => {
        const match = line.match(/^([^=\s]+)\s*=\s*"?([^"\n]+)"?/);
        if (match) {
          config[match[1]] = match[2];
        }
      });

      res.json({
        source: bestMatch.name,
        mapping: config
      });

    } catch (error) {
      console.error("[Gamepad] Autoconfig error:", error);
      res.status(500).json({ message: "Search failed." });
    }
  });
}
