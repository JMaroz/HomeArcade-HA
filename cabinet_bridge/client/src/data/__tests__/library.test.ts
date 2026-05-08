import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock @/lib/queryClient before importing library so apiUrl doesn't blow up
vi.mock("@/lib/queryClient", () => ({
  apiUrl: (path: string) => `http://localhost${path}`,
  queryClient: {},
  apiRequest: vi.fn(),
}));

import { uploadedRomToGame, formatRomSize, SYSTEMS, GAMES } from "../library";
import type { UploadedRom } from "@shared/schema";

// Minimal valid UploadedRom fixture
function makeRom(overrides: Partial<UploadedRom> = {}): UploadedRom {
  return {
    id: 1,
    title: "Super Mario World",
    system: "snes",
    slug: "super-mario-world",
    originalName: "smw.sfc",
    fileName: "smw.sfc",
    filePath: "/data/roms/smw.sfc",
    size: 512 * 1024,
    mimeType: "application/octet-stream",
    artUrl: null,
    scrapeStatus: "not_scraped",
    scrapeMessage: null,
    favorite: true,
    rating: 0,
    lastPlayed: 0,
    playCount: 0,
    discNumber: null,
    discGroup: null,
    description: null,
    releaseYear: 1990,
    developer: "Nintendo",
    publisher: "Nintendo",
    genre: "Platform",
    players: "2",
    romHash: null,
    communityScore: null,
    wheelArtUrl: null,
    minutesPlayed: 0,
    playStatus: "unset",
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("SYSTEMS", () => {
  it("contains all expected console entries", () => {
    const ids = SYSTEMS.map((s) => s.id);
    expect(ids).toContain("nes");
    expect(ids).toContain("snes");
    expect(ids).toContain("n64");
    expect(ids).toContain("gba");
    expect(ids).toContain("ps1");
    expect(ids).toContain("ps2");
    expect(ids).toContain("gb");
    expect(ids).toContain("gbc");
    expect(ids).toContain("nds");
    expect(ids).toContain("psp");
    expect(ids).toContain("genesis");
    expect(ids).toContain("arcade");
    expect(ids).toContain("dreamcast");
  });

  it("every system has required fields", () => {
    for (const sys of SYSTEMS) {
      expect(typeof sys.name).toBe("string");
      expect(typeof sys.shortName).toBe("string");
      expect(typeof sys.era).toBe("string");
      expect(Array.isArray(sys.art)).toBe(true);
      expect(sys.art).toHaveLength(2);
    }
  });

  it("has no duplicate system IDs", () => {
    const ids = SYSTEMS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("GAMES", () => {
  it("is an empty array by default (populated at runtime via uploads)", () => {
    expect(Array.isArray(GAMES)).toBe(true);
    expect(GAMES.length).toBe(0);
  });
});

describe("uploadedRomToGame", () => {
  it("maps core fields correctly", () => {
    const rom = makeRom();
    const game = uploadedRomToGame(rom);

    expect(game.id).toBe("uploaded-1");
    expect(game.title).toBe("Super Mario World");
    expect(game.system).toBe("snes");
    expect(game.slug).toBe("super-mario-world");
    expect(game.romId).toBe(1);
    expect(game.year).toBe(1990);
    expect(game.genre).toBe("Platform");
    expect(game.players).toBe("2");
    expect(game.developer).toBe("Nintendo");
    expect(game.publisher).toBe("Nintendo");
    expect(game.rating).toBe(0);
    expect(game.favorite).toBe(true);
    expect(game.playStatus).toBe("unset");
  });

  it("derives art tuple from system palette", () => {
    const rom = makeRom({ system: "snes" });
    const game = uploadedRomToGame(rom);
    // SNES art is ["264 70% 58%", "322 78% 56%"]
    expect(game.art[0]).toBe("264 70% 58%");
    expect(game.art[1]).toBe("322 78% 56%");
    expect(game.art).toHaveLength(3);
  });

  it("falls back to default art for unknown system", () => {
    const rom = makeRom({ system: "unknown-system" as any });
    const game = uploadedRomToGame(rom);
    expect(game.art[0]).toBe("322 92% 56%");
    expect(game.art[1]).toBe("188 90% 52%");
  });

  it("uses createdAt year when releaseYear is null", () => {
    const rom = makeRom({ releaseYear: null, createdAt: new Date("2023-06-15").getTime() });
    const game = uploadedRomToGame(rom);
    expect(game.year).toBe(2023);
  });

  it("falls back genre to 'Uploaded ROM' when null", () => {
    const rom = makeRom({ genre: null });
    const game = uploadedRomToGame(rom);
    expect(game.genre).toBe("Uploaded ROM");
  });

  it("falls back players to '1' when null", () => {
    const rom = makeRom({ players: null });
    const game = uploadedRomToGame(rom);
    expect(game.players).toBe("1");
  });

  it("maps playCount, minutesPlayed, lastPlayed", () => {
    const rom = makeRom({ playCount: 7, minutesPlayed: 120, lastPlayed: 9999 });
    const game = uploadedRomToGame(rom);
    expect(game.playCount).toBe(7);
    expect(game.minutesPlayed).toBe(120);
    expect(game.lastPlayed).toBe(9999);
  });

  it("maps communityScore and wheelArtUrl", () => {
    const rom = makeRom({ communityScore: 85, wheelArtUrl: "https://example.com/wheel.png" });
    const game = uploadedRomToGame(rom);
    expect(game.communityScore).toBe(85);
    expect(game.wheelArtUrl).toBe("https://example.com/wheel.png");
  });

  it("passes through artUrl", () => {
    const rom = makeRom({ artUrl: "https://example.com/art.jpg" });
    const game = uploadedRomToGame(rom);
    expect(game.artUrl).toBe("https://example.com/art.jpg");
  });

  it("maps romHash correctly", () => {
    const rom = makeRom({ romHash: "abc123" });
    const game = uploadedRomToGame(rom);
    expect(game.romHash).toBe("abc123");
  });
});

describe("formatRomSize", () => {
  it("formats bytes under 1 MB as KB", () => {
    expect(formatRomSize(500 * 1024)).toBe("500 KB");
    expect(formatRomSize(1023)).toBe("1 KB"); // min 1 KB
  });

  it("formats bytes at and above 1 MB as MB", () => {
    expect(formatRomSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatRomSize(512 * 1024 * 1024)).toBe("512.0 MB");
    expect(formatRomSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("rounds KB values", () => {
    expect(formatRomSize(1536)).toBe("2 KB"); // 1.5 KB → 2 KB
  });

  it("returns at least 1 KB for very small files", () => {
    // The implementation applies Math.max(1, ...) so even 0 bytes → "1 KB"
    expect(formatRomSize(1)).toBe("1 KB");
    expect(formatRomSize(0)).toBe("1 KB");
  });
});
