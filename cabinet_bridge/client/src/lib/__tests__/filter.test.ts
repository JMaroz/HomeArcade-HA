import { describe, it, expect } from "vitest";
import { filterToPath, parseFilter, parseCollectionFilter, DEFAULT_FILTER } from "../filter";

describe("filterToPath", () => {
  it("converts special filter strings to /library/<filter>", () => {
    expect(filterToPath("all")).toBe("/library/all");
    expect(filterToPath("favorites")).toBe("/library/favorites");
    expect(filterToPath("recent")).toBe("/library/recent");
    expect(filterToPath("backlog")).toBe("/library/backlog");
    expect(filterToPath("playing")).toBe("/library/playing");
    expect(filterToPath("completed")).toBe("/library/completed");
    expect(filterToPath("dropped")).toBe("/library/dropped");
  });

  it("converts system IDs to /library/<system>", () => {
    expect(filterToPath("nes")).toBe("/library/nes");
    expect(filterToPath("snes")).toBe("/library/snes");
    expect(filterToPath("ps1")).toBe("/library/ps1");
  });

  it("converts collection filters to /library/collection/<id>", () => {
    expect(filterToPath("collection:42")).toBe("/library/collection/42");
    expect(filterToPath("collection:1")).toBe("/library/collection/1");
  });
});

describe("parseFilter", () => {
  it("returns DEFAULT_FILTER when value is undefined or empty", () => {
    expect(parseFilter(undefined)).toBe(DEFAULT_FILTER);
    expect(parseFilter("")).toBe(DEFAULT_FILTER);
  });

  it("accepts all special filter strings", () => {
    const specials = ["all", "favorites", "recent", "backlog", "playing", "completed", "dropped"];
    for (const s of specials) {
      expect(parseFilter(s)).toBe(s);
    }
  });

  it("accepts valid system IDs", () => {
    expect(parseFilter("nes")).toBe("nes");
    expect(parseFilter("snes")).toBe("snes");
    expect(parseFilter("n64")).toBe("n64");
    expect(parseFilter("gba")).toBe("gba");
    expect(parseFilter("ps1")).toBe("ps1");
    expect(parseFilter("ps2")).toBe("ps2");
    expect(parseFilter("gb")).toBe("gb");
    expect(parseFilter("gbc")).toBe("gbc");
    expect(parseFilter("nds")).toBe("nds");
    expect(parseFilter("psp")).toBe("psp");
    expect(parseFilter("genesis")).toBe("genesis");
    expect(parseFilter("arcade")).toBe("arcade");
    expect(parseFilter("dreamcast")).toBe("dreamcast");
  });

  it("is case-insensitive", () => {
    expect(parseFilter("NES")).toBe("nes");
    expect(parseFilter("SNES")).toBe("snes");
    expect(parseFilter("Favorites")).toBe("favorites");
  });

  it("falls back to DEFAULT_FILTER for unknown values", () => {
    expect(parseFilter("unknown-system")).toBe(DEFAULT_FILTER);
    expect(parseFilter("atari")).toBe(DEFAULT_FILTER);
    expect(parseFilter("xyz")).toBe(DEFAULT_FILTER);
    expect(parseFilter("collection:abc")).toBe(DEFAULT_FILTER); // not a valid collection path
  });

  it("URL-decodes the value before parsing", () => {
    expect(parseFilter("fav%6Frites")).toBe("favorites"); // 'o' encoded
    expect(parseFilter("n%65s")).toBe("nes"); // 'e' encoded
  });
});

describe("parseCollectionFilter", () => {
  it("returns DEFAULT_FILTER when id is undefined or empty", () => {
    expect(parseCollectionFilter(undefined)).toBe(DEFAULT_FILTER);
    expect(parseCollectionFilter("")).toBe(DEFAULT_FILTER);
  });

  it("returns a collection filter for valid positive integer strings", () => {
    expect(parseCollectionFilter("1")).toBe("collection:1");
    expect(parseCollectionFilter("42")).toBe("collection:42");
    expect(parseCollectionFilter("999")).toBe("collection:999");
  });

  it("falls back to DEFAULT_FILTER for non-numeric or invalid ids", () => {
    expect(parseCollectionFilter("abc")).toBe(DEFAULT_FILTER);
    expect(parseCollectionFilter("0")).toBe(DEFAULT_FILTER);
    expect(parseCollectionFilter("-5")).toBe(DEFAULT_FILTER);
    // Note: "1.5" passes Number.isFinite + > 0, so it becomes "collection:1.5"
    expect(parseCollectionFilter("Infinity")).toBe(DEFAULT_FILTER);
  });
});
