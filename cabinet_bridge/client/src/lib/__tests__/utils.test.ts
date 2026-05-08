import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn (clsx + tailwind-merge)", () => {
  it("returns an empty string when given no arguments", () => {
    expect(cn()).toBe("");
  });

  it("concatenates plain class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
    expect(cn(false, null)).toBe("");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
    expect(cn({ active: false })).toBe("");
    expect(cn("base", { active: true })).toBe("base active");
  });

  it("handles array syntax", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn(["foo", false && "bar"])).toBe("foo");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge resolves conflicts: p-4 beats p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("mx-2", "mx-4")).toBe("mx-4");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("handles mixed clsx + Tailwind merge", () => {
    const isActive = true;
    const result = cn("btn", { "btn-active": isActive }, "p-2", "p-4");
    expect(result).toBe("btn btn-active p-4");
  });
});
