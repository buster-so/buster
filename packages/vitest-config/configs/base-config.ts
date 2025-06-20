import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      include: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      globals: true,
      testTimeout: 1000 * 60 * 2, // 2 minutes
      env: loadEnv('', process.cwd(), ''),
  };
});
