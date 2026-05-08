import { describe, it, expect } from "vitest";
import {
  SYSTEM_IMAGES,
  isSystemImageId,
  systemImageProxyPath,
  type SystemImageId,
} from "../../shared/system-images";

const EXPECTED_IDS: SystemImageId[] = [
  "nes", "snes", "n64", "gba", "genesis",
  "ps1", "ps2", "arcade", "dreamcast",
  "gb", "gbc", "nds", "psp",
];

describe("SYSTEM_IMAGES registry", () => {
  it("contains all 13 expected consoles", () => {
    expect(Object.keys(SYSTEM_IMAGES)).toHaveLength(13);
    for (const id of EXPECTED_IDS) {
      expect(SYSTEM_IMAGES).toHaveProperty(id);
    }
  });

  it("every entry has required fields with correct types", () => {
    for (const [id, img] of Object.entries(SYSTEM_IMAGES)) {
      expect(img.id).toBe(id);
      expect(typeof img.url).toBe("string");
      expect(img.url.startsWith("https://")).toBe(true);
      expect(typeof img.source).toBe("string");
      expect(img.source.length).toBeGreaterThan(0);
      expect(typeof img.sourceUrl).toBe("string");
      expect(img.sourceUrl.startsWith("https://")).toBe(true);
      expect(typeof img.license).toBe("string");
      expect(img.license.length).toBeGreaterThan(0);
    }
  });

  it("all URLs point to Wikimedia or trusted domains", () => {
    for (const img of Object.values(SYSTEM_IMAGES)) {
      const trusted =
        img.url.includes("wikimedia.org") ||
        img.url.includes("wikipedia.org");
      expect(trusted).toBe(true);
    }
  });
});

describe("isSystemImageId", () => {
  it("returns true for all valid IDs", () => {
    for (const id of EXPECTED_IDS) {
      expect(isSystemImageId(id)).toBe(true);
    }
  });

  it("returns false for invalid IDs", () => {
    expect(isSystemImageId("")).toBe(false);
    expect(isSystemImageId("atari")).toBe(false);
    expect(isSystemImageId("xbox")).toBe(false);
    expect(isSystemImageId("SNES")).toBe(false); // case-sensitive
    expect(isSystemImageId("NES")).toBe(false);
  });
});

describe("systemImageProxyPath", () => {
  it("returns a same-origin API path for each system", () => {
    for (const id of EXPECTED_IDS) {
      expect(systemImageProxyPath(id)).toBe(`/api/system-images/${id}`);
    }
  });

  it("path always starts with /api/system-images/", () => {
    expect(systemImageProxyPath("nes")).toBe("/api/system-images/nes");
    expect(systemImageProxyPath("ps2")).toBe("/api/system-images/ps2");
  });
});
