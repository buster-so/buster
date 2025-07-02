import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Limit to core projects to avoid extension performance issues
    projects: ['apps/*/vitest.config.ts', 'packages/*/vitest.config.ts'],
  },
});
