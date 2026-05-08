import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
    include: [
      "server/__tests__/**/*.test.ts",
      "shared/__tests__/**/*.test.ts",
      "client/src/**/__tests__/**/*.test.ts",
      "client/src/__tests__/**/*.test.ts",
    ],
    benchmark: {
      include: ["client/src/__benchmarks__/**/*.bench.ts"],
    },
    environmentMatchGlobs: [
      ["client/src/**", "happy-dom"],
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
});
