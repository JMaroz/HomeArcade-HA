import type { Express } from "express";
import os from "node:os";
import fs from "node:fs";
import { CORE_PERFORMANCE_TIERS } from "@shared/bios-metadata";

export function registerSystemRoutes(app: Express) {
  app.get("/api/system", (_req, res) => {
    let cpuModel: string | null = null;
    try {
      if (process.platform === "linux") {
        const cpuinfo = fs.readFileSync("/proc/cpuinfo", "utf-8");
        const piMatch = cpuinfo.match(/^Model\s*:\s*(.+)$/m);
        if (piMatch) {
          cpuModel = piMatch[1].trim();
        } else {
          const modelMatch = cpuinfo.match(/^model name\s*:\s*(.+)$/m);
          if (modelMatch) cpuModel = modelMatch[1].trim();
        }
      }
    } catch {}

    const arch = process.arch === "arm64" ? "arm64" : "x64";

    const cores: Record<string, string> = {};
    for (const [core, tiers] of Object.entries(CORE_PERFORMANCE_TIERS)) {
      cores[core] = tiers[arch as keyof typeof tiers] ?? "playable";
    }

    res.json({
      arch,
      platform: process.platform,
      cpuModel,
      cores,
    });
  });
}
