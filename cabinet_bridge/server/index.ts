import "dotenv/config";
import compression from "compression";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { createServer } from "node:http";
import { initializeDatabase } from "./storage";

const app = express();
const httpServer = createServer(app);

app.use(compression({
  filter: (req, res) => {
    if (req.path.endsWith("/scrape-all")) return false;
    return compression.filter(req, res);
  }
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Strip HA ingress prefix from URLs
const INGRESS_PREFIX_RE = /^\/api\/(?:hassio_)?ingress\/[^/]+/;
app.use((req, _res, next) => {
  const match = req.url.match(INGRESS_PREFIX_RE);
  if (match) {
    const stripped = req.url.slice(match[0].length) || "/";
    req.url = stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });
  next();
});

// Health-check endpoint — responds immediately, before full init completes.
// This keeps HA ingress happy while the server is still booting.
let appReady = false;
app.get("/api/health", (_req, res) => {
  res.json({ status: appReady ? "ok" : "starting" });
});

const port = parseInt(process.env.PORT || "5000", 10);

// Bind the HTTP server FIRST so HA ingress can connect immediately.
httpServer.listen({ port, host: "0.0.0.0" }, () => {
  log(`listening on port ${port}`, "boot");
  // Kick off async init after the port is open.
  startApp().catch((err) => {
    console.error("FATAL: app init failed:", err);
    process.exit(1);
  });
});

async function startApp() {
  log("Initializing database...", "boot");
  initializeDatabase();
  log("Database ready", "boot");

  const { registerRoutes } = await import("./routes/index");
  await registerRoutes(httpServer, app);
  log("Routes registered", "boot");

  const { attachNetplayServer } = await import("./netplay");
  attachNetplayServer(httpServer);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Unhandled error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = require("node:path").resolve(process.cwd(), "dist", "public");
    const fs = require("node:fs");
    if (!fs.existsSync(distPath)) {
      log(`WARNING: dist/public not found at ${distPath} — UI will not be served`, "boot");
    } else {
      const { serveStatic } = await import("./static");
      serveStatic(app);
      log(`Serving static files from ${distPath}`, "boot");
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  appReady = true;
  log("App fully initialized", "boot");
}
