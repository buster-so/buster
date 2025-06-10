import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

  return {
    plugins: [tsconfigPaths()],
    test: {
      // These settings will merge with the root config since this package
      // is included in the root config's projects array
      include: ['tests/**/*.test.ts'],
    },
  };
});
