import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      include: [
        '**/*.test.ts',
        '**/*.integration.test.ts',
        '**/*.unit.test.ts',
        '**/*.int.test.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.next/**',
        '**/playwright-tests/**',
        '**/e2e/**',
      ],
      globals: true,
      environment: 'node',
      testTimeout: 1000 * 60 * 5, // 5 minutes
      env: loadEnv('', process.cwd(), ''),
    },
  };
});
