import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

export interface WebDavConfig {
  url: string;
  username?: string;
  password?: string;
}

export interface WebDavFileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
}

export class WebDavClient {
  private baseUrl: string;
  private authHeader: string | null = null;

  constructor(config: WebDavConfig) {
    this.baseUrl = (config.url || "").trim().replace(/\/+$/, "");
    if (config.username) {
      const creds = Buffer.from(`${config.username}:${config.password || ""}`).toString("base64");
      this.authHeader = `Basic ${creds}`;
    }
  }

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.authHeader) {
      headers["Authorization"] = this.authHeader;
    }
    return headers;
  }

  /**
   * Tests whether the WebDAV server is reachable and credentials are valid.
   */
  async testConnection(): Promise<{ ok: boolean; message: string; status: number }> {
    if (!this.baseUrl) {
      return { ok: false, message: "WebDAV URL is not configured", status: 0 };
    }

    try {
      const res = await fetch(this.baseUrl, {
        method: "PROPFIND",
        headers: this.getHeaders({ Depth: "0" }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 207 || (res.status >= 200 && res.status < 300)) {
        return { ok: true, message: "Connected successfully to WebDAV server", status: res.status };
      }

      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: "Authentication failed: invalid username or password", status: res.status };
      }

      // Some WebDAV providers (or reverse proxies) return 405 on PROPFIND at root; fallback to GET
      const getRes = await fetch(this.baseUrl, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (getRes.status >= 200 && getRes.status < 400) {
        return { ok: true, message: "Connected successfully", status: getRes.status };
      }

      return { ok: false, message: `Server returned status ${res.status}`, status: res.status };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Connection timed out or failed", status: 0 };
    }
  }

  /**
   * Ensures remote folder hierarchy exists by creating missing collections via MKCOL.
   */
  async ensureDirectory(remoteDir: string): Promise<boolean> {
    const cleanDir = remoteDir.replace(/^\/+|\/+$/g, "");
    if (!cleanDir) return true;
    const parts = cleanDir.split("/");
    let current = "";

    for (const part of parts) {
      current += `/${encodeURIComponent(part)}`;
      const url = `${this.baseUrl}${current}`;
      try {
        const check = await fetch(url, {
          method: "PROPFIND",
          headers: this.getHeaders({ Depth: "0" }),
          signal: AbortSignal.timeout(8000),
        });

        if (check.status === 404) {
          const mkRes = await fetch(url, {
            method: "MKCOL",
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(8000),
          });
          if (mkRes.status !== 201 && mkRes.status !== 200 && mkRes.status !== 405) {
            return false;
          }
        }
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Uploads a file to remote path via HTTP PUT.
   */
  async uploadFile(remotePath: string, data: Buffer): Promise<boolean> {
    const parts = remotePath.replace(/^\/+/, "").split("/");
    const encodedPath = "/" + parts.map(encodeURIComponent).join("/");
    const url = `${this.baseUrl}${encodedPath}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders({
        "Content-Type": "application/octet-stream",
        "Content-Length": String(data.length),
      }),
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(30000),
    });

    return res.status === 201 || res.status === 200 || res.status === 204;
  }

  /**
   * Downloads a file from remote path via HTTP GET.
   */
  async downloadFile(remotePath: string): Promise<Buffer | null> {
    const parts = remotePath.replace(/^\/+/, "").split("/");
    const encodedPath = "/" + parts.map(encodeURIComponent).join("/");
    const url = `${this.baseUrl}${encodedPath}`;

    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  /**
   * Syncs all local saves to WebDAV /HomeArcade/saves/.
   */
  async syncSaves(
    saveBackupDir: string,
    remoteBaseDir = "HomeArcade/saves",
  ): Promise<{ uploaded: number; failed: number }> {
    if (!existsSync(saveBackupDir)) {
      return { uploaded: 0, failed: 0 };
    }

    await this.ensureDirectory(remoteBaseDir);

    let uploaded = 0;
    let failed = 0;

    async function scanFiles(dir: string, rel = ""): Promise<{ fullPath: string; relPath: string }[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const results: { fullPath: string; relPath: string }[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const relative = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          results.push(...(await scanFiles(full, relative)));
        } else if (entry.isFile()) {
          results.push({ fullPath: full, relPath: relative });
        }
      }
      return results;
    }

    const localFiles = await scanFiles(saveBackupDir);

    for (const file of localFiles) {
      try {
        const remoteSubdir = path.dirname(`${remoteBaseDir}/${file.relPath}`);
        await this.ensureDirectory(remoteSubdir);
        const content = await fs.readFile(file.fullPath);
        const ok = await this.uploadFile(`${remoteBaseDir}/${file.relPath}`, content);
        if (ok) uploaded++;
        else failed++;
      } catch {
        failed++;
      }
    }

    return { uploaded, failed };
  }
}
