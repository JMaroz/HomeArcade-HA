/**
 * Cabinet Bridge — integration tests for the Express API routes.
 *
 * Run with:  npx vitest run  (or add "test": "vitest run" to package.json)
 *
 * These tests create an in-process Express app backed by an in-memory SQLite
 * database so no real data files are created or modified.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";

// ── Minimal in-memory server fixture ─────────────────────────────────────────
// We spin up the real registerRoutes() but override CABINET_DATA_DIR to a
// temp directory so tests don't read/write real data.

process.env.CABINET_DATA_DIR = "/tmp/cabinet-test-" + Date.now();
process.env.NODE_ENV = "test";

import { registerRoutes } from "../routes";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });
  server = httpServer;
  const addr = httpServer.address() as { port: number };
  baseUrl = `http://127.0.0.1:${addr.port}`;
}, 15_000);

afterAll(() => {
  server?.close();
});

// ── Helper ────────────────────────────────────────────────────────────────────
async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/roms", () => {
  it("returns an empty array initially", async () => {
    const { status, body } = await api("GET", "/api/roms");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});

describe("GET /api/collections", () => {
  it("returns an empty array initially", async () => {
    const { status, body } = await api("GET", "/api/collections");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/collections", () => {
  it("creates a collection", async () => {
    const { status, body } = await api("POST", "/api/collections", { name: "Test Collection" });
    expect(status).toBe(201);
    expect(body.name).toBe("Test Collection");
    expect(typeof body.id).toBe("number");
  });

  it("rejects empty name", async () => {
    const { status } = await api("POST", "/api/collections", { name: "" });
    expect(status).toBe(400);
  });
});

describe("GET /api/roms/:id — not found", () => {
  it("returns 404 for non-existent ROM", async () => {
    const { status } = await api("GET", "/api/roms/99999");
    expect(status).toBe(404);
  });
});

describe("GET /api/roms/:id/save-states", () => {
  it("returns 404 for non-existent ROM", async () => {
    const { status } = await api("GET", "/api/roms/99999/save-states");
    expect(status).toBe(404);
  });
});

describe("GET /api/roms/:id/save-backups", () => {
  it("returns 404 for non-existent ROM", async () => {
    const { status } = await api("GET", "/api/roms/99999/save-backups");
    expect(status).toBe(404);
  });
});

describe("GET /api/kiosk", () => {
  it("returns kiosk config", async () => {
    const { status, body } = await api("GET", "/api/kiosk");
    expect(status).toBe(200);
    expect(typeof body.enabled).toBe("boolean");
  });
});

describe("GET /api/settings/integration", () => {
  it("returns default settings", async () => {
    const { status, body } = await api("GET", "/api/settings/integration");
    expect(status).toBe(200);
    expect(typeof body.haBaseUrl).toBe("string");
    expect(typeof body.liveMode).toBe("boolean");
  });
});

describe("PUT /api/settings/integration", () => {
  it("persists settings", async () => {
    const { status, body } = await api("PUT", "/api/settings/integration", {
      haBaseUrl: "https://ha.example.com",
      haToken: "",
      liveMode: true,
      endpoints: {},
      ssUserId: "",
      ssPassword: "",
      kioskMode: false,
      kioskPin: "",
      kioskCollectionId: null,
      raUsername: "testuser",
      raToken: "",
    });
    expect(status).toBe(200);
    expect(body.haBaseUrl).toBe("https://ha.example.com");
    expect(body.raUsername).toBe("testuser");

    // Re-fetch to confirm persistence
    const get = await api("GET", "/api/settings/integration");
    expect(get.body.haBaseUrl).toBe("https://ha.example.com");
  });
});

describe("POST /api/import/emulationstation", () => {
  it("handles empty gamelist gracefully", async () => {
    const xml = '<?xml version="1.0"?><gameList></gameList>';
    const res = await fetch(`${baseUrl}/api/import/emulationstation`, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.imported).toBe(0);
    expect(body.skipped).toBe(0);
  });
});

describe("POST /api/import/launchbox", () => {
  it("handles empty LaunchBox XML gracefully", async () => {
    const xml = '<?xml version="1.0"?><LaunchBox></LaunchBox>';
    const res = await fetch(`${baseUrl}/api/import/launchbox`, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.imported).toBe(0);
  });
});

describe("GET /api/system-images", () => {
  it("lists all system images", async () => {
    const { status, body } = await api("GET", "/api/system-images");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(5);
    const ids = body.map((s: { id: string }) => s.id);
    expect(ids).toContain("nes");
    expect(ids).toContain("ps1");
    expect(ids).toContain("gb");
    expect(ids).toContain("psp");
    expect(ids).toContain("nds");
  });
});

describe("GET /api/upload-limits", () => {
  it("returns max upload size", async () => {
    const { status, body } = await api("GET", "/api/upload-limits");
    expect(status).toBe(200);
    expect(typeof body.maxUploadMb).toBe("number");
    expect(body.maxUploadMb).toBeGreaterThan(0);
  });
});
