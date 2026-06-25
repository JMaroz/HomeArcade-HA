import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import type { Express } from "express";
import { getDataDir } from "../data-dir";
import { ROM_ROOT } from "./shared";

type DirectoryRoot = {
  id: string;
  label: string;
  path: string;
  available: boolean;
};

const CANDIDATE_ROOTS: Array<Omit<DirectoryRoot, "available">> = [
  { id: "media", label: "Home Assistant media", path: "/media" },
  { id: "share", label: "Home Assistant share", path: "/share" },
  { id: "backup", label: "Home Assistant backup", path: "/backup" },
  { id: "data", label: "HomeArcade data", path: getDataDir() },
  { id: "romRoot", label: "HomeArcade ROM storage", path: ROM_ROOT },
];

function normalizeForCompare(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function pathWithin(candidate: string, root: string): boolean {
  const normalizedCandidate = normalizeForCompare(candidate);
  const normalizedRoot = normalizeForCompare(root);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`);
}

function directoryRoots(): DirectoryRoot[] {
  const seen = new Set<string>();
  const roots: DirectoryRoot[] = [];
  for (const root of CANDIDATE_ROOTS) {
    const resolved = path.resolve(root.path);
    const key = normalizeForCompare(resolved);
    if (seen.has(key)) continue;
    seen.add(key);
    let available = false;
    try {
      available = fsSync.statSync(resolved).isDirectory();
    } catch {
      available = false;
    }
    roots.push({
      ...root,
      path: resolved,
      available,
    });
  }
  return roots;
}

function resolveRequestedDirectory(rawPath: unknown): string {
  const roots = directoryRoots().filter((root) => root.available);
  const requested = typeof rawPath === "string" && rawPath.trim() ? rawPath.trim() : roots[0]?.path;
  if (!requested) throw Object.assign(new Error("No browsable directories are available."), { statusCode: 404 });

  const resolved = path.resolve(requested);
  const allowed = roots.some((root) => pathWithin(resolved, root.path));
  if (!allowed) {
    throw Object.assign(new Error("Directory is outside the allowed HomeArcade browse roots."), { statusCode: 403 });
  }
  return resolved;
}

export function registerFilesystemRoutes(app: Express) {
  app.get("/api/filesystem/roots", (_req, res) => {
    res.json({ roots: directoryRoots() });
  });

  app.get("/api/filesystem/directories", async (req, res) => {
    try {
      const currentPath = resolveRequestedDirectory(req.query.path);
      const stat = await fs.stat(currentPath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ message: "Requested path is not a directory." });
      }

      const roots = directoryRoots().filter((root) => root.available);
      const rootForCurrent = roots.find((root) => pathWithin(currentPath, root.path));
      const parentPath =
        rootForCurrent && normalizeForCompare(currentPath) !== normalizeForCompare(rootForCurrent.path)
          ? path.dirname(currentPath)
          : null;

      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => {
          const fullPath = path.join(currentPath, entry.name);
          let readable = true;
          try {
            fsSync.accessSync(fullPath, fsSync.constants.R_OK);
          } catch {
            readable = false;
          }
          return { name: entry.name, path: fullPath, readable };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json({ currentPath, parentPath, roots, directories });
    } catch (err: any) {
      const status = Number(err?.statusCode) || 500;
      res.status(status).json({ message: err?.message || "Unable to browse directories." });
    }
  });
}
