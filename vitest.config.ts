import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      include: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.next/**',
        '**/playwright-tests/**',
        '**/e2e/**',
      ],
      // Define projects - each uses its own config
      projects: ['apps/web', 'apps/server', 'packages/*'],
      globals: true,
      testTimeout: 1000 * 60 * 5, // 5 minutes
      env: loadEnv('', process.cwd(), ''),
    },
  };
});
