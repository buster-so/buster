import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Note: Using dynamic import to avoid ES module issues
export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      projects: ['packages/*', 'trigger', 'server'],
      include: [
        '**/*.test.ts',
        '**/*.integration.test.ts',
        '**/*.unit.test.ts',
        '**/*.int.test.ts',
      ],
      globals: true,
      environment: 'node',
      testTimeout: 1000 * 60 * 5, // 5 minutes
      env: loadEnv('', process.cwd(), ''),
    },
  };
});
