import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22', // Bun is compatible with recent Node.js versions
  platform: 'node',
  outDir: 'dist',
  clean: true,
  dts: false, // Disable for now due to TypeScript file list errors
  sourcemap: true,
  minify: false, // Don't minify for bun runtime
  splitting: false,
  shims: false, // Bun doesn't need shims
  external: [
    // Mark all workspace packages as external to avoid bundling them
    '@buster/access-controls',
    '@buster/database',
    '@buster/server-shared',
    '@buster/slack',
    '@buster/test-utils',
    '@buster/typescript-config',
    '@buster/vitest-config',
    '@buster/ai',
    '@buster/data-source',
    '@buster/github',
    '@buster/search',
    '@buster/slack',
    '@buster/test-utils',
    '@buster/typescript-config',
    '@buster/vitest-config',
    '@buster/web-tools',
    '@buster/sandbox',
    '@buster-app/trigger',
  ],
  noExternal: [
    // Bundle these specific packages if needed
  ],
  esbuildOptions(options) {
    // Additional esbuild options for bun compatibility
    options.keepNames = true; // Preserve function names for better debugging
  },
});
