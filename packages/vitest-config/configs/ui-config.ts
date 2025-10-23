import { loadEnv } from 'vite';
import type { Plugin } from 'vitest/config';
import { defineConfig } from 'vitest/config';

export const uiConfig = defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths() as unknown as Plugin],
    test: {
      include: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      globals: true,
      environment: 'jsdom',
      testTimeout: 1000 * 60 * 2, // 2 minutes
      env: loadEnv('', process.cwd(), ''),
      // Use threads for better performance - only use forks if you need process isolation
      pool: 'threads',
      poolOptions: {
        threads: {
          // Let Vitest decide based on CPU cores (defaults to # of CPUs)
          // In CI: use fewer workers to avoid resource contention
          maxThreads: process.env.CI ? 2 : undefined,
          minThreads: process.env.CI ? 1 : 1,
          // Isolate each test file in its own environment
          isolate: true,
        },
      },
    },
  };
});
