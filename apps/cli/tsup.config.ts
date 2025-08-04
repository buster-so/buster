import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  dts: false,
  sourcemap: true,
  minify: false,
  splitting: false,
  shims: false,
  external: [
    '@buster/server-shared',
    '@buster/typescript-config',
    '@buster/vitest-config',
  ],
  esbuildOptions(options) {
    options.keepNames = true;
  },
});