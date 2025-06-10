import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  };
});
