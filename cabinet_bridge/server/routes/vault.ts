import { Express } from "express";
import { storage } from "../storage";
import { log } from "../log";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

export function registerVaultRoutes(app: Express) {
  /**
   * Library Health Summary
   * Returns counts of games missing specific metadata.
   */
  app.get("/api/vault/health", async (_req, res) => {
    try {
      const roms = await storage.listUploadedRoms();
      
      const summary = {
        total: roms.length,
        missingArt: roms.filter(r => !r.artUrl).length,
        missingDescription: roms.filter(r => !r.description).length,
        missingYear: roms.filter(r => !r.releaseYear).length,
        missingGenre: roms.filter(r => !r.genre).length,
        failedScrapes: roms.filter(r => r.scrapeStatus === "failed").length,
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
}
