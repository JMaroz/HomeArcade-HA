import type { Express } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { dataPath, ensureDir } from "../data-dir";
import { REQUIRED_BIOS } from "@shared/bios-metadata";

const BIOS_ROOT = path.resolve(dataPath("bios"));

async function getMd5(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash("md5").update(buffer).digest("hex");
  } catch {
    return "";
  }
}

export function registerBiosRoutes(app: Express) {
  ensureDir(BIOS_ROOT);

  // Get status of all required BIOS files
  app.get("/api/bios", async (_req, res) => {
    const status: Record<string, Array<{ filename: string; exists: boolean; verified: boolean; label?: string }>> = {};
    
    for (const [core, files] of Object.entries(REQUIRED_BIOS)) {
      status[core] = await Promise.all(
        files.map(async (meta) => {
          const filePath = path.join(BIOS_ROOT, meta.filename);
          try {
            await fs.access(filePath);
            const actualMd5 = await getMd5(filePath);
            // Allow "Verified" if MD5 matches OR if it's the catch-all
            const isVerified = actualMd5 === meta.md5 || meta.md5 === "00000000000000000000000000000000";
            return { 
              filename: meta.filename, 
              exists: true, 
              verified: isVerified,
              label: meta.label,
              md5: actualMd5
            };
          } catch {
            return { filename: meta.filename, exists: false, verified: false, label: meta.label };
          }
        })
      );
    }
    
    res.json(status);
  });

  // Upload a BIOS file
  app.post(
    "/api/bios/upload",
    express.raw({ type: "*/*", limit: "50mb" }),
    async (req, res) => {
      const rawFilename = decodeURIComponent(String(req.header("x-bios-filename") ?? ""));
      
      if (!rawFilename) {
        return res.status(400).json({ message: "No filename provided." });
      }

      // Case-insensitive match — find the canonical filename from our allowed list
      const allAllowedFiles = Object.values(REQUIRED_BIOS).flat();
      const matchedMeta = allAllowedFiles.find(
        (m) => m.filename.toLowerCase() === rawFilename.toLowerCase()
      );

      if (!matchedMeta) {
        return res.status(400).json({ message: `Filename '${rawFilename}' is not a recognized BIOS file.` });
      }

      const canonicalFilename = matchedMeta.filename;

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (body.length === 0) {
        return res.status(400).json({ message: "Empty file body." });
      }

      // Always write using the canonical (lowercase) filename
      const filePath = path.join(BIOS_ROOT, canonicalFilename);
      await fs.writeFile(filePath, body);

      res.status(201).json({ success: true, filename: canonicalFilename });
    }
  );

  // Serve BIOS file for the emulator
  app.get("/api/bios/file/:filename", async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(BIOS_ROOT, filename);

    try {
      await fs.access(filePath);
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.sendFile(filePath);
    } catch {
      res.status(404).json({ message: "BIOS file not found." });
    }
  });
}
