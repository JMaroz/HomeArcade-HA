import path from "node:path";
import fs from "node:fs";

export function getAbsoluteFilePath(
  rom: { filePath: string; system: string; fileName: string },
  watchPaths: string[]
): string {
  const directPath = path.resolve(rom.filePath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const normalisedPath = rom.filePath.replace(/\\/g, "/");
  const sysSegment = `/${rom.system.toLowerCase()}/`;
  const sysIdx = normalisedPath.toLowerCase().indexOf(sysSegment);

  if (sysIdx !== -1) {
    const relativePath = normalisedPath.slice(sysIdx + 1);
    for (const wp of watchPaths) {
      const localPath = path.resolve(wp, relativePath);
      if (fs.existsSync(localPath)) {
        return localPath;
      }
    }
  }

  return directPath;
}
