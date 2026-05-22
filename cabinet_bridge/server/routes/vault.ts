import { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { ensureDriveFolder, uploadToDrive, downloadFromDrive } from "../google-drive";
import { SAVE_BACKUP_DIR } from "./shared";

export function registerVaultRoutes(app: Express) {
  /**
   * Library Health Summary
   * Returns counts of games missing specific metadata.
   */
  app.get("/api/vault/health", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      const bios = await storage.getBiosStatus();
      
      const summary = {
        total: roms.length,
        missingArt: roms.filter(r => !r.artUrl).length,
        missingDescription: roms.filter(r => !r.description).length,
        missingYear: roms.filter(r => !r.releaseYear).length,
        missingGenre: roms.filter(r => !r.genre).length,
        failedScrapes: roms.filter(r => r.scrapeStatus === "failed").length,
        bios,
      };

      res.json(summary);
    } catch (err: any) {
      log(`Vault health failed: ${err.message}`, "vault");
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

      for (const rom of roms) {
        // Check if file exists
        if (!existsSync(rom.filePath)) {
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

      for (const rom of roms) {
        if (!existsSync(rom.filePath)) {
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
