import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";

function staticLog(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [static] ${message}`);
}

// Applied to every static asset response so HA ingress cannot override them.
function setCrossOriginHeaders(res: Response) {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Accept-Ranges");
  res.removeHeader("X-Frame-Options");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    staticLog(`ERROR: Build output not found at ${distPath}`);
    return;
  }

  staticLog(`Serving from ${distPath}`);

  // Middleware to ensure COOP/COEP headers are set before express.static sends
  // the response. express.static's own setHeaders callback runs after headers
  // are already partially written in some Express versions, so we use a
  // preceding middleware to be safe.
  app.use((req: Request, res: Response, next: NextFunction) => {
    setCrossOriginHeaders(res);
    next();
  });

  app.use(express.static(distPath, {
    setHeaders(res) {
      setCrossOriginHeaders(res);
    },
  }));

  // SPA fallback - serve index.html for all non-API and non-asset routes
  app.get("/{*path}", (req: Request, res: Response, next: NextFunction) => {
    const p = req.path;
    if (p.startsWith("/api")) return next();
    
    // Do not return HTML for missing static assets
    const assetExtensions = [".js", ".wasm", ".data", ".css", ".png", ".jpg", ".jpeg", ".svg", ".json", ".bin"];
    if (assetExtensions.some(ext => p.toLowerCase().endsWith(ext))) {
      return res.status(404).send("Not Found");
    }

    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      setCrossOriginHeaders(res);
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}
