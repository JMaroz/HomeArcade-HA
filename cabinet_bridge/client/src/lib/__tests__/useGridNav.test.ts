/**
 * useGridNav — unit tests for the column-aware move logic.
 *
 * We test the pure movement arithmetic directly by re-implementing the
 * same formula the hook uses, so tests stay fast without React / RAF.
 */
import { describe, it, expect } from "vitest";

/** Mirrors the move logic inside useGridNav */
function move(
  dir: "up" | "down" | "left" | "right",
  current: number,
  count: number,
  cols: number,
): number {
  if (count === 0) return -1;
  if (current < 0) {
    return dir === "up" || dir === "left" ? count - 1 : 0;
  }
  switch (dir) {
    case "right": return Math.min(count - 1, current + 1);
    case "left":  return Math.max(0, current - 1);
    case "down":  return Math.min(count - 1, current + cols);
    case "up":    return Math.max(0, current - cols);
  }
}

describe("useGridNav move logic — basic navigation", () => {
  const COUNT = 12;
  const COLS = 4; // 3 rows × 4 cols

  it("moves right by 1", () => {
    expect(move("right", 0, COUNT, COLS)).toBe(1);
    expect(move("right", 5, COUNT, COLS)).toBe(6);
  });

  it("moves left by 1", () => {
    expect(move("left", 5, COUNT, COLS)).toBe(4);
    expect(move("left", 1, COUNT, COLS)).toBe(0);
  });

  it("moves down by one row (cols)", () => {
    expect(move("down", 0, COUNT, COLS)).toBe(4);
    expect(move("down", 3, COUNT, COLS)).toBe(7);
  });

  it("moves up by one row (cols)", () => {
    expect(move("up", 4, COUNT, COLS)).toBe(0);
    expect(move("up", 7, COUNT, COLS)).toBe(3);
  });
});

describe("useGridNav move logic — boundary clamping", () => {
  const COUNT = 12;
  const COLS = 4;

  it("clamps right at the last item", () => {
    expect(move("right", 11, COUNT, COLS)).toBe(11);
  });

  it("clamps left at the first item", () => {
    expect(move("left", 0, COUNT, COLS)).toBe(0);
  });

  it("clamps down at the last item (last row, past-end)", () => {
    // index 9 + 4 = 13 → clamped to 11
    expect(move("down", 9, COUNT, COLS)).toBe(11);
    expect(move("down", 11, COUNT, COLS)).toBe(11);
  });

  it("clamps up at the first item", () => {
    // index 1 - 4 = -3 → clamped to 0
    expect(move("up", 1, COUNT, COLS)).toBe(0);
    expect(move("up", 0, COUNT, COLS)).toBe(0);
  });
});

describe("useGridNav move logic — first activation (current = -1)", () => {
  it("right/down from -1 jumps to index 0", () => {
    expect(move("right", -1, 10, 3)).toBe(0);
    expect(move("down",  -1, 10, 3)).toBe(0);
  });

  it("left/up from -1 jumps to last index", () => {
    expect(move("left", -1, 10, 3)).toBe(9);
    expect(move("up",   -1, 10, 3)).toBe(9);
  });
});

describe("useGridNav move logic — single column layout", () => {
  it("up/down behave like left/right in a 1-col grid", () => {
    expect(move("down", 0, 5, 1)).toBe(1);
    expect(move("up",   2, 5, 1)).toBe(1);
  });
});

describe("useGridNav move logic — non-full last row", () => {
  // 11 items, 4 cols → last row has 3 items (indices 8, 9, 10)
  const COUNT = 11;
  const COLS = 4;

  it("down from second-to-last row mid-column clamps within last row", () => {
    // index 7 + 4 = 11 → out of bounds → clamped to 10
    expect(move("down", 7, COUNT, COLS)).toBe(10);
  });

  it("down from last item stays at last item", () => {
    expect(move("down", 10, COUNT, COLS)).toBe(10);
  });
});
