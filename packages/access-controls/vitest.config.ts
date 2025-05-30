import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@buster/database': resolve(__dirname, '../database/src/index.ts'),
      '@': resolve(__dirname, '../database/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
    testTimeout: 60000, // 60 seconds for LLM and database operations
    hookTimeout: 60000,
    env: loadEnv('', process.cwd(), '../../'),
  },
});
