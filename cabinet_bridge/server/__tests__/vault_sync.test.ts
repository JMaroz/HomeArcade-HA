import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createZip, extractZip } from "../zip";
import { WebDavClient } from "../webdav";

describe("Native ZIP & WebDAV Save Sync", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join("/tmp", "vault-sync-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  describe("ZIP Pack & Extract (Pure Stdlib / Ponytail)", () => {
    it("creates a standard ZIP archive and extracts all files with directory structures", async () => {
      const file1 = Buffer.from("STATE_DATA_USER_1_ROM_123");
      const file2 = Buffer.from("BATTERY_SAVE_POKEMON_CRYSTAL_SRM");
      const file3 = Buffer.from("SCREENSHOT_JPEG_DATA_ABC");

      const entries = [
        { name: "1/123/slot-1.state", data: file1 },
        { name: "1/456/save.srm", data: file2 },
        { name: "2/789/slot-auto.jpg", data: file3 },
      ];

      const zipBuf = await createZip(entries);
      expect(zipBuf.length).toBeGreaterThan(0);
      // ZIP magic bytes: PK\x03\x04
      expect(zipBuf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

      const extracted = await extractZip(zipBuf);
      expect(extracted).toHaveLength(3);

      const map = new Map(extracted.map((e) => [e.name, e.data]));
      expect(map.get("1/123/slot-1.state")).toEqual(file1);
      expect(map.get("1/456/save.srm")).toEqual(file2);
      expect(map.get("2/789/slot-auto.jpg")).toEqual(file3);
    });

    it("sanitizes relative paths and protects against Zip Slip attacks", async () => {
      const maliciousEntries = [
        { name: "../../etc/passwd", data: Buffer.from("root:x:0:0:") },
        { name: "safe/slot.state", data: Buffer.from("legit_state") },
      ];

      const zipBuf = await createZip(maliciousEntries);
      const extracted = await extractZip(zipBuf);

      // Malicious path must either be normalized away from escaping or sanitized
      for (const entry of extracted) {
        expect(entry.name).not.toContain("..");
        expect(path.isAbsolute(entry.name)).toBe(false);
      }
    });
  });

  describe("WebDAV Client", () => {
    it("reports success on valid PROPFIND 207 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 207,
        ok: true,
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new WebDavClient({
        url: "https://nextcloud.example.com/remote.php/dav/files/user",
        username: "user",
        password: "secretpassword",
      });

      const res = await client.testConnection();
      expect(res.ok).toBe(true);
      expect(res.status).toBe(207);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://nextcloud.example.com/remote.php/dav/files/user",
        expect.objectContaining({
          method: "PROPFIND",
          headers: expect.objectContaining({
            Depth: "0",
            Authorization: expect.stringContaining("Basic "),
          }),
        }),
      );

      vi.unstubAllGlobals();
    });

    it("reports authentication failure on 401 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new WebDavClient({
        url: "https://nas.local/webdav",
        username: "admin",
        password: "wrongpassword",
      });

      const res = await client.testConnection();
      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
      expect(res.message).toContain("Authentication failed");

      vi.unstubAllGlobals();
    });

    it("uploads saves to remote WebDAV collection", async () => {
      const mockFetch = vi.fn().mockImplementation((url: string, opts: any) => {
        if (opts.method === "PROPFIND") {
          return Promise.resolve({ status: 200 });
        }
        if (opts.method === "MKCOL") {
          return Promise.resolve({ status: 201 });
        }
        if (opts.method === "PUT") {
          return Promise.resolve({ status: 201 });
        }
        return Promise.resolve({ status: 200 });
      });
      vi.stubGlobal("fetch", mockFetch);

      // Create test saves on disk
      const userDir = path.join(tempDir, "1", "42");
      fs.mkdirSync(userDir, { recursive: true });
      fs.writeFileSync(path.join(userDir, "slot-1.state"), Buffer.from("TEST_SAVE_CONTENT"));

      const client = new WebDavClient({
        url: "https://nas.local/webdav",
        username: "user",
        password: "pass",
      });

      const syncResult = await client.syncSaves(tempDir);
      expect(syncResult.uploaded).toBe(1);
      expect(syncResult.failed).toBe(0);

      vi.unstubAllGlobals();
    });
  });
});
