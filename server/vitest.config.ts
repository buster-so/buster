import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@buster/database': path.resolve(__dirname, '../packages/database/src'),
      '~/trigger': path.resolve(__dirname, '../trigger'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
