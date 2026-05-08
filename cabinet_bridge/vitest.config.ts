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
    ],
    environmentMatchGlobs: [
      // Client-side tests run in a browser-like environment
      ["client/src/**", "happy-dom"],
    ],
    environment: "node", // default for server + shared tests
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
});
