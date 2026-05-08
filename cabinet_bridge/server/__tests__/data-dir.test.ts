import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const TEST_BASE = path.join(os.tmpdir(), "cabinet-test-" + process.pid);

// Reset module cache before each test so the getDataDir() singleton re-evaluates
beforeEach(() => vi.resetModules());

afterEach(() => {
  fs.rmSync(TEST_BASE, { recursive: true, force: true });
});

async function freshDataDir(envDir: string) {
  process.env.CABINET_DATA_DIR = envDir;
  return import("../data-dir");
}

describe("dataPath", () => {
  it("joins a single segment under the data dir", async () => {
    const dir = path.join(TEST_BASE, "test-a");
    const { dataPath } = await freshDataDir(dir);
    expect(dataPath("data.db")).toBe(path.join(path.resolve(dir), "data.db"));
  });

  it("joins multiple segments under the data dir", async () => {
    const dir = path.join(TEST_BASE, "test-b");
    const { dataPath } = await freshDataDir(dir);
    expect(dataPath("roms", "snes")).toBe(
      path.join(path.resolve(dir), "roms", "snes"),
    );
  });

  it("with no segments returns the data dir itself", async () => {
    const dir = path.join(TEST_BASE, "test-c");
    const { dataPath } = await freshDataDir(dir);
    expect(dataPath()).toBe(path.resolve(dir));
  });
});

describe("ensureDir", () => {
  it("creates a nested directory and returns its path", async () => {
    const dir = path.join(TEST_BASE, "ensure", "a", "b", "c");
    const { ensureDir } = await freshDataDir(path.join(TEST_BASE, "base-e"));
    const result = ensureDir(dir);
    expect(result).toBe(dir);
    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.statSync(dir).isDirectory()).toBe(true);
  });

  it("is idempotent — calling twice does not throw", async () => {
    const dir = path.join(TEST_BASE, "idempotent");
    const { ensureDir } = await freshDataDir(path.join(TEST_BASE, "base-f"));
    ensureDir(dir);
    expect(() => ensureDir(dir)).not.toThrow();
  });
});

describe("getDataDir", () => {
  it("respects CABINET_DATA_DIR and creates the directory", async () => {
    const custom = path.join(TEST_BASE, "custom-" + Date.now());
    const { getDataDir } = await freshDataDir(custom);
    expect(getDataDir()).toBe(path.resolve(custom));
    expect(fs.existsSync(custom)).toBe(true);
  });

  it("caches the result on repeated calls", async () => {
    const dir = path.join(TEST_BASE, "cached");
    const { getDataDir } = await freshDataDir(dir);
    const first = getDataDir();
    const second = getDataDir();
    expect(first).toBe(second);
  });
});
