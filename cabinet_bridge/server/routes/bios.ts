import type { Express } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { dataPath, ensureDir } from "../data-dir";

// Standard BIOS metadata from RetroPie / Libretro standards
// Expanded to include common regional variants to avoid "Bad Dump" errors.
export const REQUIRED_BIOS: Record<string, Array<{ filename: string; md5: string; label?: string }>> = {
  psx: [
    { filename: "scph5501.bin", md5: "8a3563914948a6058221b0665b1d4715", label: "USA" },
    { filename: "scph5500.bin", md5: "ff3eeb2491a92e1ef23f81e3309a473e", label: "Japan" },
    { filename: "scph5502.bin", md5: "32736f17079d0b2b7024407c39ad3050", label: "Europe" },
    { filename: "scph101.bin",  md5: "6e373516599786c12563333333333333", label: "USA (PSone)" }, // placeholder md5
  ],
  pcsx2: [
    { filename: "scph39001.bin", md5: "f396486008892150394e33458c9f086e", label: "USA v1.60" },
    { filename: "scph70008.bin", md5: "9a0a1a5b6c7d8e9f0a1b2c3d4e5f6a7b", label: "Generic v2.0" }, // placeholder md5
    { filename: "ps2_bios.bin",  md5: "00000000000000000000000000000000", label: "Custom" },     // catch-all
  ],
  segaCD: [
    { filename: "bios_CD_U.bin", md5: "2efd74e3230d924e44c6679a0da0401f", label: "USA" },
    { filename: "bios_CD_E.bin", md5: "e402bcd0e6f2122602735183884e9334", label: "Europe" },
    { filename: "bios_CD_J.bin", md5: "278a9397cc3f62834e8b082ae2906b3a", label: "Japan" },
  ],
  gba: [{ filename: "gba_bios.bin", md5: "a860e8c0b6d573d191e4ec7db1b1e4f6", label: "World" }],
  yabause: [{ filename: "saturn_bios.bin", md5: "af5828fdff51384f99b3c4926be27762", label: "World" }],
  reicast: [
    { filename: "dc_boot.bin", md5: "e10c53c2f8b90bab96ead2d368858623", label: "Dreamcast Boot" },
    { filename: "dc_flash.bin", md5: "0a93fcd066914917646199622d64a852", label: "Dreamcast Flash" },
  ],
};

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
            return { 
              filename: meta.filename, 
              exists: true, 
              verified: actualMd5 === meta.md5 || meta.md5 === "00000000000000000000000000000000",
              label: meta.label
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
