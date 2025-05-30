import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
  },
  resolve: {
    alias: {
      '@database': path.resolve(__dirname, '../database/src/index.ts'),
      '@buster/database': path.resolve(__dirname, '../database/src/index.ts'),
      // Resolve @/ imports for the database package
      '@/connection': path.resolve(__dirname, '../database/src/connection.ts'),
      '@/migrate': path.resolve(__dirname, '../database/src/migrate.ts'),
      '@/setup': path.resolve(__dirname, '../database/src/setup.ts'),
      '@/schema': path.resolve(__dirname, '../database/src/schema.ts'),
      '@/relations': path.resolve(__dirname, '../database/src/relations.ts'),
    },
  },
});
