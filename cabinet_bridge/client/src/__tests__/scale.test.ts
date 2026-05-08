/**
 * Scale tests — verify correctness and acceptable timing when the library
 * contains realistic numbers of ROMs (500, 1000, 2000).
 *
 * These are regular tests (not benchmarks) so they run with: npx vitest run
 * Each test has a time budget; if it blows past it, something is wrong.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/queryClient", () => ({
  apiUrl: (p: string) => `http://localhost${p}`,
  queryClient: {},
  apiRequest: vi.fn(),
}));

import { uploadedRomToGame, SYSTEMS } from "@/data/library";
import { filterToPath, parseFilter } from "@/lib/filter";
import type { UploadedRom } from "@shared/schema";

// ── ROM fixture factory ───────────────────────────────────────────────────────
const SYSTEM_IDS = SYSTEMS.map((s) => s.id).filter(
  (id) => !["favorites", "recent", "all", "backlog", "playing", "completed", "dropped"].includes(id),
);

function makeRom(i: number): UploadedRom {
  const system = SYSTEM_IDS[i % SYSTEM_IDS.length];
  return {
    id: i,
    title: `Game Title ${i}`,
    system,
    slug: `game-title-${i}`,
    originalName: `game${i}.rom`,
    fileName: `game${i}.rom`,
    filePath: `/data/roms/game${i}.rom`,
    size: (i % 512) * 1024 * 1024 + 1024,
    mimeType: "application/octet-stream",
    artUrl: i % 3 === 0 ? `https://example.com/art/${i}.jpg` : null,
    scrapeStatus: i % 4 === 0 ? "scraped" : "not_scraped",
    scrapeMessage: null,
    favorite: i % 5 === 0,
    rating: i % 6,
    lastPlayed: i % 2 === 0 ? Date.now() - i * 60_000 : 0,
    playCount: i % 10,
    discNumber: null,
    discGroup: null,
    description: i % 3 === 0 ? `A description for game ${i}` : null,
    releaseYear: 1985 + (i % 25),
    developer: `Dev Studio ${i % 20}`,
    publisher: `Publisher ${i % 15}`,
    genre: ["Platform", "RPG", "Racing", "Puzzle", "Fighting"][i % 5],
    players: ["1", "2", "4"][i % 3],
    romHash: null,
    communityScore: i % 2 === 0 ? 50 + (i % 50) : null,
    wheelArtUrl: null,
    minutesPlayed: i * 3,
    playStatus: ["unset", "backlog", "playing", "completed"][i % 4],
    createdAt: Date.now() - i * 86_400_000,
  };
}

// ── uploadedRomToGame at scale ────────────────────────────────────────────────
describe("uploadedRomToGame — large library mapping", () => {
  it("maps 500 ROMs correctly in < 50ms", () => {
    const roms = Array.from({ length: 500 }, (_, i) => makeRom(i));
    const start = performance.now();
    const games = roms.map(uploadedRomToGame);
    const elapsed = performance.now() - start;

    expect(games).toHaveLength(500);
    expect(games[0].id).toBe("uploaded-0");
    expect(games[499].id).toBe("uploaded-499");
    // Every game must have a valid 3-stop art tuple
    for (const g of games) expect(g.art).toHaveLength(3);
    expect(elapsed).toBeLessThan(50);
    console.info(`  500 ROMs mapped in ${elapsed.toFixed(2)}ms`);
  });

  it("maps 2000 ROMs correctly in < 200ms", () => {
    const roms = Array.from({ length: 2000 }, (_, i) => makeRom(i));
    const start = performance.now();
    const games = roms.map(uploadedRomToGame);
    const elapsed = performance.now() - start;

    expect(games).toHaveLength(2000);
    expect(elapsed).toBeLessThan(200);
    console.info(`  2000 ROMs mapped in ${elapsed.toFixed(2)}ms`);
  });
});

// ── Filtering / sorting at scale (mirrors Home.tsx logic) ────────────────────
describe("Library filter + sort — realistic search workload", () => {
  const GAMES = Array.from({ length: 1000 }, (_, i) => uploadedRomToGame(makeRom(i)));

  it("text search across 1000 games in < 10ms", () => {
    const query = "game title 42";
    const start = performance.now();
    const results = GAMES.filter((g) =>
      g.title.toLowerCase().includes(query.toLowerCase()),
    );
    const elapsed = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(10);
    console.info(`  Search "${query}" → ${results.length} results in ${elapsed.toFixed(2)}ms`);
  });

  it("system filter across 1000 games in < 5ms", () => {
    const start = performance.now();
    const results = GAMES.filter((g) => g.system === "snes");
    const elapsed = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(5);
    console.info(`  SNES filter → ${results.length} results in ${elapsed.toFixed(2)}ms`);
  });

  it("favorites filter across 1000 games in < 5ms", () => {
    const start = performance.now();
    const results = GAMES.filter((g) => g.favorite);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    console.info(`  Favorites filter → ${results.length} results in ${elapsed.toFixed(2)}ms`);
  });

  it("sort by title (A-Z) across 1000 games in < 20ms", () => {
    const copy = [...GAMES];
    const start = performance.now();
    copy.sort((a, b) => a.title.localeCompare(b.title));
    const elapsed = performance.now() - start;

    expect(copy[0].title <= copy[1].title).toBe(true);
    expect(elapsed).toBeLessThan(20);
    console.info(`  Sort by title (1000 games) in ${elapsed.toFixed(2)}ms`);
  });

  it("sort by rating (desc) across 1000 games in < 10ms", () => {
    const copy = [...GAMES];
    const start = performance.now();
    copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    console.info(`  Sort by rating (1000 games) in ${elapsed.toFixed(2)}ms`);
  });

  it("sort by lastPlayed (recent) across 1000 games in < 10ms", () => {
    const copy = [...GAMES];
    const start = performance.now();
    copy.sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    console.info(`  Sort by lastPlayed (1000 games) in ${elapsed.toFixed(2)}ms`);
  });

  it("combined text+system filter across 1000 games in < 15ms", () => {
    const start = performance.now();
    const results = GAMES.filter(
      (g) => g.system === "nes" && g.title.toLowerCase().includes("5"),
    );
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(15);
    console.info(`  Combined filter → ${results.length} results in ${elapsed.toFixed(2)}ms`);
  });
});

// ── parseFilter at scale ──────────────────────────────────────────────────────
describe("parseFilter — repeated calls (simulates rapid navigation)", () => {
  it("handles 10,000 parseFilter calls in < 50ms", () => {
    const inputs = ["snes", "nes", "favorites", "all", "unknown", "ps1", "backlog", "playing"];
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      parseFilter(inputs[i % inputs.length]);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    console.info(`  10,000 parseFilter calls in ${elapsed.toFixed(2)}ms`);
  });
});

// ── Grid nav at scale (gamepad polling at 60fps) ──────────────────────────────
describe("Grid nav move — simulated 60fps gamepad polling", () => {
  function move(dir: "up"|"down"|"left"|"right", cur: number, count: number, cols: number) {
    if (count === 0) return -1;
    if (cur < 0) return dir === "up" || dir === "left" ? count - 1 : 0;
    switch (dir) {
      case "right": return Math.min(count - 1, cur + 1);
      case "left":  return Math.max(0, cur - 1);
      case "down":  return Math.min(count - 1, cur + cols);
      case "up":    return Math.max(0, cur - cols);
    }
  }

  it("3600 move calls (60fps × 60s) complete in < 5ms", () => {
    const dirs: ("up"|"down"|"left"|"right")[] = ["right","down","left","up"];
    let idx = 0;
    const start = performance.now();
    for (let i = 0; i < 3_600; i++) {
      idx = move(dirs[i % 4], idx, 500, 5);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    console.info(`  3600 move() calls in ${elapsed.toFixed(2)}ms (${(elapsed/3600*1000).toFixed(3)}μs each)`);
  });
});
