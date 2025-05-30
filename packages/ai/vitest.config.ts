import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: './tests/globalSetup.ts',
    setupFiles: ['./tests/testSetup.ts'],
    env: {
      ...loadEnv('', process.cwd(), ''),
    },
    testTimeout: 30000, // 30 seconds for integration tests
  },
});
