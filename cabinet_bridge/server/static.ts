import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { log } from "./log";

export function serveStatic(app: Express) {
  // Use process.cwd() instead of __dirname for ESM reliability
  const distPath = path.join(process.cwd(), "dist", "public");
  
  log(`Serving static assets from: ${distPath}`, "static");
  
  if (!fs.existsSync(distPath)) {
    log(`CRITICAL: Static directory NOT FOUND at ${distPath}`, "static");
  }

  app.use(express.static(distPath, {
    maxAge: '1h',
    index: false 
  }));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.url.startsWith("/api")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
