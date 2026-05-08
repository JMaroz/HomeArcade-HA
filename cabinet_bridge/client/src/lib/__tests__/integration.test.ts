import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// formatRelative is a pure function; we only import it, not the React parts.
// We need to mock the module because integration.tsx also exports React components
// that would fail to render in a non-DOM context.
// Instead, test the function by importing it directly — happy-dom handles React.

// Minimal mock for useIntegration consumers
vi.mock("@/lib/queryClient", () => ({
  apiUrl: (p: string) => `http://localhost${p}`,
  queryClient: { invalidateQueries: vi.fn() },
  apiRequest: vi.fn(),
}));

import { formatRelative } from "../integration";

const NOW = 1_700_000_000_000; // fixed reference epoch

describe("formatRelative", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function at(ts: number) {
    vi.setSystemTime(NOW);
    return formatRelative(ts);
  }

  it("returns 'just now' for timestamps under 30 seconds ago", () => {
    // Math.round(abs / 60_000) < 1 means abs < 30_000ms
    expect(at(NOW)).toBe("just now");
    expect(at(NOW - 10_000)).toBe("just now"); // 10s
    expect(at(NOW - 29_000)).toBe("just now"); // 29s
  });

  it("returns minutes for timestamps 30 seconds+ ago (rounds to nearest minute)", () => {
    expect(at(NOW - 30_000)).toBe("1m ago");  // 30s rounds up to 1m
    expect(at(NOW - 60_000)).toBe("1m ago");  // exactly 1m
    expect(at(NOW - 5 * 60_000)).toBe("5m ago");
    expect(at(NOW - 59 * 60_000)).toBe("59m ago");
  });

  it("returns hours for timestamps 1–23 hours ago", () => {
    expect(at(NOW - 60 * 60_000)).toBe("1h ago");
    expect(at(NOW - 6 * 3600_000)).toBe("6h ago");
    expect(at(NOW - 23 * 3600_000)).toBe("23h ago");
  });

  it("returns days for timestamps 24+ hours ago", () => {
    expect(at(NOW - 24 * 3600_000)).toBe("1d ago");
    expect(at(NOW - 7 * 24 * 3600_000)).toBe("7d ago");
    expect(at(NOW - 30 * 24 * 3600_000)).toBe("30d ago");
  });
});
