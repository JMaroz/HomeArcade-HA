import { LIBRETRO_PLAYLISTS } from "./routes/shared";

interface RomIdentification {
  name: string;
  description: string;
}

/**
 * Identify a ROM by its CRC32 checksum using the Libretro database.
 * 
 * @param systemId The internal system ID (e.g., 'nes', 'snes').
 * @param crc32    The calculated CRC32 checksum (hex string).
 */
export async function identifyRomByCrc(systemId: string, crc32: string): Promise<RomIdentification | null> {
  const playlistName = LIBRETRO_PLAYLISTS[systemId];
  if (!playlistName) return null;

  try {
    const datUrl = `https://raw.githubusercontent.com/libretro/libretro-database/master/dat/${encodeURIComponent(playlistName)}.dat`;
    const response = await fetch(datUrl);
    if (!response.ok) {
      console.warn(`[Libretro] Failed to fetch DAT for ${playlistName}: ${response.status}`);
      return null;
    }

    const text = await response.text();
    
    // Libretro DAT (clrmamepro) format parser
    // We look for: crc <CRC32> inside a game block
    const targetCrc = crc32.toUpperCase();
    
    // This regex looks for the game block containing the specific CRC.
    // It captures the 'name' and 'description' from that block.
    const gameBlockRegex = new RegExp(
      `game\\s*\\([\\s\\S]*?name\\s*"([^"]+)"[\\s\\S]*?description\\s*"([^"]+)"[\\s\\S]*?rom\\s*\\([\\s\\S]*?crc\\s*${targetCrc}[\\s\\S]*?\\)[\\s\\S]*?\\)`,
      "i"
    );

    const match = text.match(gameBlockRegex);
    if (match) {
      return {
        name: match[1],
        description: match[2]
      };
    }

    return null;
  } catch (error) {
    console.error(`[Libretro] Error identifying ROM ${crc32} for ${systemId}:`, error);
    return null;
  }
}
