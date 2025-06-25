import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'], // ESM for development
  target: 'node18',
  platform: 'node',
  clean: true,
  minify: false,
  sourcemap: true,
  bundle: false, // Faster builds for development
  splitting: false,
  env: {
    NODE_ENV: 'development',
  },
});
