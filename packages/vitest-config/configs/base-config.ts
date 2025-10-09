import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import type { Plugin, ViteUserConfig } from 'vitest/config';

export const baseConfig = defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths() as unknown as Plugin],
    test: {
      include: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      globals: true,
      testTimeout: 1000 * 60 * 2, // 2 minutes
      env: loadEnv('', process.cwd(), ''),
      pool: 'forks',
      poolOptions: {
        forks: {
          maxForks: process.env.CI ? 1 : 8,
          minForks: process.env.CI ? 1 : 8,
        },
      },
    },
  } satisfies ViteUserConfig;
});
