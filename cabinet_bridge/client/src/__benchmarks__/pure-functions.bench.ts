/**
 * Micro-benchmarks for the pure utility functions that run on the hot path:
 * every keystroke (filter/sort), every gamepad poll (move), every card render (cn).
 *
 * Run with:  npx vitest bench
 */
import { describe, bench } from "vitest";
import { cn } from "@/lib/utils";
import { filterToPath, parseFilter, parseCollectionFilter } from "@/lib/filter";
import { formatRomSize } from "@/data/library";
import { isSystemImageId, systemImageProxyPath } from "@shared/system-images";

// ── Grid nav move logic (inline — mirrors useGridNav internals) ───────────────
function move(
  dir: "up" | "down" | "left" | "right",
  current: number,
  count: number,
  cols: number,
): number {
  if (count === 0) return -1;
  if (current < 0) return dir === "up" || dir === "left" ? count - 1 : 0;
  switch (dir) {
    case "right": return Math.min(count - 1, current + 1);
    case "left":  return Math.max(0, current - 1);
    case "down":  return Math.min(count - 1, current + cols);
    case "up":    return Math.max(0, current - cols);
  }
}

describe("cn() — Tailwind class merging", () => {
  bench("simple concat (2 strings)", () => {
    cn("flex items-center", "gap-2");
  });

  bench("conflict resolution (p-2 vs p-4)", () => {
    cn("p-2 m-2 text-sm font-bold", "p-4");
  });

  bench("conditional object syntax (5 keys)", () => {
    cn("btn", {
      "btn-active": true,
      "btn-disabled": false,
      "btn-lg": true,
      "opacity-50": false,
      "cursor-not-allowed": false,
    });
  });

  bench("realistic GameCard className (full string)", () => {
    const focused = true;
    cn(
      "group relative rounded-lg overflow-hidden border bg-card hover-elevate active-elevate-2 focus:outline-none transition-[border-color,box-shadow] duration-100",
      focused
        ? "border-accent ring-2 ring-accent/60 ring-offset-1 ring-offset-background shadow-[0_0_12px_2px_hsl(var(--accent)/0.35)]"
        : "border-card-border focus-visible:ring-2 focus-visible:ring-accent",
    );
  });
});

describe("filter utilities — called on every route change & search", () => {
  bench("filterToPath (system ID)", () => {
    filterToPath({ type: "system", value: "snes" });
  });

  bench("filterToPath (collection)", () => {
    filterToPath({ type: "collection", value: "42" });
  });

  bench("parseFilter (valid system)", () => {
    parseFilter("snes");
  });

  bench("parseFilter (invalid → fallback)", () => {
    parseFilter("unknown-system-xyz");
  });

  bench("parseFilter (URL-encoded)", () => {
    parseFilter("fav%6Frites");
  });

  bench("parseCollectionFilter (valid)", () => {
    parseCollectionFilter("42");
  });
});

describe("formatRomSize — called for every ROM in file list", () => {
  bench("< 1 MB (KB path)", () => {
    formatRomSize(512 * 1024);
  });

  bench(">= 1 MB (MB path)", () => {
    formatRomSize(32 * 1024 * 1024);
  });
});

describe("system-images — called on every system tile render", () => {
  bench("isSystemImageId (valid)", () => {
    isSystemImageId("snes");
  });

  bench("isSystemImageId (invalid)", () => {
    isSystemImageId("atari2600");
  });

  bench("systemImageProxyPath", () => {
    systemImageProxyPath("ps1");
  });
});

describe("grid nav move — called on every arrow key & 60fps gamepad poll", () => {
  bench("move right (mid-grid)", () => {
    move("right", 25, 100, 5);
  });

  bench("move down (mid-grid)", () => {
    move("down", 25, 100, 5);
  });

  bench("move right (boundary clamp)", () => {
    move("right", 99, 100, 5);
  });

  bench("first activation (current = -1)", () => {
    move("right", -1, 100, 5);
  });
});
