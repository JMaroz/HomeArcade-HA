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
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
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

  // SPA fallback - serve index.html for all non-API routes
  // Express 5 requires named wildcard: /{*path} instead of bare *
  app.get("/{*path}", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) return next();
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      setCrossOriginHeaders(res);
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}
