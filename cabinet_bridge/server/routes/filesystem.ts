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

type DirectoryEntry = {
  name: string;
  path: string;
  readable: boolean;
};

const PSEUDO_FS = new Set([
  "proc", "sysfs", "tmpfs", "devtmpfs", "devpts",
  "cgroup", "cgroup2", "overlay", "squashfs", "ramfs",
  "hugetlbfs", "mqueue", "configfs", "debugfs", "tracefs",
  "securityfs", "efivarfs", "pstore", "autofs", "bpf",
  "fusectl", "rpc_pipefs",
]);

const CANDIDATE_ROOTS: Array<Omit<DirectoryRoot, "available">> = [
  { id: "media", label: "Home Assistant media", path: "/media" },
  { id: "mnt", label: "System mounts (/mnt)", path: "/mnt" },
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

function discoverMountPoints(): DirectoryRoot[] {
  try {
    const content = fsSync.readFileSync("/proc/mounts", "utf-8");
    const seen = new Set<string>();
    const mounts: DirectoryRoot[] = [];
    for (const line of content.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const [, mountPoint, fsType] = parts;
      if (PSEUDO_FS.has(fsType)) continue;
      if (mountPoint === "/") continue;

      const resolved = path.resolve(mountPoint);
      const key = normalizeForCompare(resolved);
      if (seen.has(key)) continue;

      const alreadyCovered = CANDIDATE_ROOTS.some((root) => {
        const normalizedRoot = normalizeForCompare(path.resolve(root.path));
        return resolved === normalizedRoot || resolved.startsWith(`${normalizedRoot}/`);
      });
      if (alreadyCovered) continue;

      seen.add(key);
      let available = false;
      try {
        available = fsSync.statSync(resolved).isDirectory();
      } catch {
        available = false;
      }
      mounts.push({
        id: `mnt-${mounts.length}`,
        label: `Mounted: ${path.basename(resolved)}`,
        path: resolved,
        available,
      });
    }
    return mounts;
  } catch {
    return [];
  }
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
  for (const mount of discoverMountPoints()) {
    const key = normalizeForCompare(mount.path);
    if (seen.has(key)) continue;
    seen.add(key);
    roots.push(mount);
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
      const directories: DirectoryEntry[] = [];
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = path.join(currentPath, entry.name);
        let isDir = entry.isDirectory();
        if (!isDir && entry.isSymbolicLink()) {
          try {
            isDir = (await fs.stat(fullPath)).isDirectory();
          } catch {
            isDir = false;
          }
        }
        if (!isDir) continue;
        let readable = true;
        try {
          fsSync.accessSync(fullPath, fsSync.constants.R_OK);
        } catch {
          readable = false;
        }
        directories.push({ name: entry.name, path: fullPath, readable });
      }
      directories.sort((a, b) => a.name.localeCompare(b.name));

      res.json({ currentPath, parentPath, roots, directories });
    } catch (err: any) {
      const status = Number(err?.statusCode) || 500;
      res.status(status).json({ message: err?.message || "Unable to browse directories." });
    }
  });
}
