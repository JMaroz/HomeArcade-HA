import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  optimizeDeps: {
    include: [
      "framer-motion",
      "motion",
      "react",
      "react-dom",
      "@tanstack/react-query",
      "wouter",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/](framer-motion|motion)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-query",
              test: /node_modules[\\/](@tanstack[\\/]react-query|wouter)[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-radix",
              test: /node_modules[\\/]@radix-ui[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
