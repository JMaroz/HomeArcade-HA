import type { Express } from "express";
import * as scanner from "../scanner";

export function registerScannerRoutes(app: Express) {
  // ── ROM scanner ──────────────────────────────────────────────────────────────────────
  app.get("/api/scanner/status", (_req, res) => {
    res.json(scanner.getStatus());
  });

  app.post("/api/scanner/scan-now", async (_req, res) => {
    try {
      const status = await scanner.scanNow();
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ message: String(err) });
    }
  });

  // ── Streaming SSE Scan endpoint ──────────────────────────────────────────
  const handleScanStream = async (_req: any, res: any) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const send = (data: any) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        // stream may have closed
      }
    };

    try {
      await scanner.scanNow(send);
      res.end();
    } catch (err: any) {
      send({ type: "error", message: err?.message || String(err) });
      res.end();
    }
  };

  app.get("/api/scanner/scan-stream", handleScanStream);
  app.post("/api/scanner/scan-stream", handleScanStream);
}
