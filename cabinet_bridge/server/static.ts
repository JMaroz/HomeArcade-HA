import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { log } from "./index";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  log(`Checking static assets at: ${distPath}`, "static");

  if (!fs.existsSync(distPath)) {
    // Log the error but do NOT throw — throwing kills the process before
    // the HTTP server can respond to HA's ingress health checks.
    log(`ERROR: Build directory not found at ${distPath}`, "static");
    return;
  }

  log(`Serving static files from ${distPath}`, "static");
  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
