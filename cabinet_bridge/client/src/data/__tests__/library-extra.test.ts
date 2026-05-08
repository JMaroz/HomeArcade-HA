import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/queryClient", () => ({
  apiUrl: (p: string) => `http://localhost${p}`,
  queryClient: {},
  apiRequest: vi.fn(),
}));

import { gameLaunchEndpoint } from "../library";
import type { Game } from "../library";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "uploaded-1",
    title: "Super Mario World",
    system: "snes",
    slug: "super-mario-world",
    year: 1990,
    genre: "Platform",
    players: "2",
    rating: 0,
    art: ["264 70% 58%", "322 78% 56%", "42 96% 56%"],
    romId: 1,
    favorite: false,
    playStatus: "unset",
    ...overrides,
  };
}

describe("gameLaunchEndpoint", () => {
  it("returns a webhook URL based on the game slug", () => {
    const game = makeGame({ slug: "super-mario-world" });
    expect(gameLaunchEndpoint(game)).toBe(
      "/api/webhook/cabinet_launch_super-mario-world",
    );
  });

  it("always starts with /api/webhook/cabinet_launch_", () => {
    const game = makeGame({ slug: "sonic-the-hedgehog" });
    expect(gameLaunchEndpoint(game)).toMatch(/^\/api\/webhook\/cabinet_launch_/);
  });

  it("includes the full slug verbatim", () => {
    const slug = "the-legend-of-zelda-ocarina-of-time";
    const game = makeGame({ slug });
    expect(gameLaunchEndpoint(game)).toBe(
      `/api/webhook/cabinet_launch_${slug}`,
    );
  });
});
