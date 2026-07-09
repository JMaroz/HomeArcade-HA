import { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { ensureDriveFolder, uploadToDrive, downloadFromDrive } from "../google-drive";
import { SAVE_BACKUP_DIR } from "./shared";
import { getAbsoluteFilePath } from "../utils";

export function registerVaultRoutes(app: Express) {
  /**
   * Library Health Summary
   * Returns counts of games missing specific metadata.
   */
  app.get("/api/vault/health", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      const bios = await storage.getBiosStatus();
      const [unplayed, duplicateGroups, failedScrapes] = await Promise.all([
        storage.countUnplayedRoms(),
        storage.getDuplicateGroups(),
        storage.countFailedScrapes(),
      ]);
      
      const summary = {
        total: roms.length,
        missingArt: roms.filter(r => !r.artUrl).length,
        missingDescription: roms.filter(r => !r.description).length,
        missingYear: roms.filter(r => !r.releaseYear).length,
        missingGenre: roms.filter(r => !r.genre).length,
        failedScrapes,
        unplayed,
        duplicateGroups: duplicateGroups.length,
        bios,
      };

      log(`Vault health: ${summary.total} ROMs, ${summary.failedScrapes} failed, ${summary.unplayed} unplayed, ${summary.duplicateGroups} dup groups`, "vault");
      res.json(summary);
    } catch (err: any) {
      log(`Vault health failed: ${err.message}`, "vault");
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Storage Snapshot
   * Returns a complete overview of ROM storage: total size, per-system
   * breakdown, disk usage, watch-path file counts, and cache sizes.
   */
  app.get("/api/vault/storage-snapshot", async (_req, res) => {
    try {
      const snapshot = await storage.getStorageSnapshot();
      res.json(snapshot);
    } catch (err: any) {
      log(`Storage snapshot failed: ${err.message}`, "vault");
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Batch Deduplicate
   * Removes duplicate database entries (keeps the first entry per hash).
   * Does not delete the actual file on disk.
   */
  app.post("/api/vault/dedup", async (_req, res) => {
    try {
      const result = await storage.deleteDuplicateRoms();
      log(`Vault dedup: removed ${result.deletedCount} entries, kept ${result.keptCount} groups`, "vault");
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Batch Delete Unplayed
   * Removes ROM files and database entries for unplayed games.
   * Optional query param ?system= to scope to one system.
   */
  app.post("/api/vault/delete-unplayed", async (req, res) => {
    try {
      const system = req.query.system ? String(req.query.system) : undefined;
      const roms = await storage.listUploadedRoms();
      const toDelete = roms.filter(r => {
        const isUnplayed = r.minutesPlayed == null || r.minutesPlayed === 0;
        return system ? isUnplayed && r.system === system : isUnplayed;
      });

      let deletedCount = 0;
      for (const rom of toDelete) {
        const removed = await storage.deleteUploadedRomWithFile(rom.id);
        if (removed) deletedCount++;
      }

      log(`Vault delete-unplayed: removed ${deletedCount} entries (system: ${system ?? "all"})`, "vault");
      res.json({ success: true, deletedCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Batch Delete Failed Scrapes
   * Removes ROM files and database entries where scraping failed.
   */
  app.post("/api/vault/delete-failed", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      const failed = roms.filter(r => r.scrapeStatus === "failed");

      let deletedCount = 0;
      for (const rom of failed) {
        const removed = await storage.deleteUploadedRomWithFile(rom.id);
        if (removed) deletedCount++;
      }

      log(`Vault delete-failed: removed ${deletedCount} entries`, "vault");
      res.json({ success: true, deletedCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Batch Delete by System
   * Removes all ROM files and database entries for a given system.
   */
  app.post("/api/vault/delete-system", async (req, res) => {
    try {
      const system = req.body?.system as string | undefined;
      if (!system) {
        res.status(400).json({ message: "Missing system in request body." });
        return;
      }

      const roms = await storage.listUploadedRoms();
      const toDelete = roms.filter(r => r.system === system);

      let deletedCount = 0;
      for (const rom of toDelete) {
        const removed = await storage.deleteUploadedRomWithFile(rom.id);
        if (removed) deletedCount++;
      }

      log(`Vault delete-system: removed ${deletedCount} entries for system ${system}`, "vault");
      res.json({ success: true, system, deletedCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Library Audit
   * Checks every ROM in the database against the filesystem.
   * Identifies dead links and duplicate files.
   */
  app.get("/api/vault/audit", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      const deadLinks: any[] = [];
      const hashGroups: Record<string, any[]> = {};

      const settings = await storage.getIntegrationSettings();
      const watchPaths = (settings.libraryWatchPaths ?? "")
        .split(",")
        .map((p) => path.resolve(p.trim()))
        .filter(Boolean);

      for (const rom of roms) {
        const resolvedPath = getAbsoluteFilePath(rom, watchPaths);
        // Check if file exists
        if (!existsSync(resolvedPath)) {
          deadLinks.push({ id: rom.id, title: rom.title, path: rom.filePath });
        }

        // Group by hash for duplicates
        if (rom.romHash) {
          if (!hashGroups[rom.romHash]) hashGroups[rom.romHash] = [];
          hashGroups[rom.romHash].push({ id: rom.id, title: rom.title, system: rom.system });
        }
      }

      const duplicates = Object.values(hashGroups).filter(group => group.length > 1);

      res.json({
        deadLinks,
        duplicates
      });
    } catch (err: any) {
      log(`Vault audit failed: ${err.message}`, "vault");
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Batch Prune Dead Links
   * Removes database entries for files that no longer exist.
   */
  app.post("/api/vault/prune", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      let count = 0;

      const settings = await storage.getIntegrationSettings();
      const watchPaths = (settings.libraryWatchPaths ?? "")
        .split(",")
        .map((p) => path.resolve(p.trim()))
        .filter(Boolean);

      for (const rom of roms) {
        const resolvedPath = getAbsoluteFilePath(rom, watchPaths);
        if (!existsSync(resolvedPath)) {
          await storage.deleteUploadedRom(rom.id);
          count++;
        }
      }

      log(`Vault prune: removed ${count} dead links`, "vault");
      res.json({ success: true, removedCount: count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  /**
   * Test Google Drive Connection
   */
  app.get("/api/vault/test-drive", async (_req, res) => {
    try {
      const folderId = await ensureDriveFolder();
      res.json({ ok: true, message: `Successfully connected to Google Drive. Saves folder ID: ${folderId}`, folderId });
    } catch (err: any) {
      log(`Drive test failed: ${err.message}`, "cloud");
      res.status(500).json({ ok: false, message: err.message });
    }
  });

  /**
   * Bulk Sync Local Saves to Cloud
   */
  app.post("/api/vault/cloud-sync", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      const settings = await storage.getIntegrationSettings();
      
      let uploadCount = 0;
      let downloadCount = 0;

      for (const rom of roms) {
        const slots = await storage.listAllRomSaveSlots(rom.id);
        for (const slot of slots) {
          const localPath = path.join(SAVE_BACKUP_DIR, slot.userId, String(rom.id), `slot-${slot.slot}.state`);
          const driveFileName = `${slot.userId}_${rom.id}_slot-${slot.slot}.state`;

          // 1. Try to download newer version
          const downloaded = await downloadFromDrive(driveFileName, localPath).catch(() => false);
          if (downloaded) downloadCount++;

          // 2. Upload local if it exists
          if (existsSync(localPath)) {
            await uploadToDrive(localPath, driveFileName).catch(() => {});
            uploadCount++;
          }
        }
      }

      res.json({ success: true, uploaded: uploadCount, downloaded: downloadCount });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
