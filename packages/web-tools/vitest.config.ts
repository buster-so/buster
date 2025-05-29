import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 120000, // 2 minutes for potentially slow API calls
    hookTimeout: 10000, // 10 seconds for setup/teardown
    env: {
      ...loadEnv('', process.cwd(), ''),
    },
  },
});
