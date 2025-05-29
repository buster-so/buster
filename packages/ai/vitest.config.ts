import { defineConfig } from 'vitest/config';

import { loadEnv } from 'vite';

export default defineConfig({
  test: {
    globalSetup: './src/globalSetup.ts', // Adjusted path
    setupFiles: ['./src/testSetup.ts'], // Adjusted path
    env: {
      ...loadEnv('', process.cwd(), ''),
    },
  },
});
