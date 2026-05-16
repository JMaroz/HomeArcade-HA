import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'client/src/__tests__/**/*.test.ts',
      'server/__tests__/**/*.test.ts',
    ],
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
    coverage: {
      reporter: ['text', 'html'],
      include: ['server/**/*.ts', 'client/src/**/*.ts'],
      exclude: ['**/__tests__/**', '**/node_modules/**'],
    },
  },
});
