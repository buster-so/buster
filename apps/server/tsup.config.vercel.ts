import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs'], // CommonJS for better Node.js compatibility on Vercel
  target: 'node18', // Vercel uses Node.js 18+
  platform: 'node',
  clean: true,
  minify: false, // Keep readable for debugging
  sourcemap: true,
  bundle: true, // Bundle all dependencies including workspace packages
  splitting: false, // Single file output for serverless
  external: [
    // External dependencies that should not be bundled
    '@supabase/supabase-js',
    'hono',
    'pino',
    'zod',
  ],
  noExternal: [
    // Force bundling of workspace packages
    '@buster/server-shared',
    '@buster/database',
    '@buster/access-controls',
  ],
  env: {
    NODE_ENV: 'production',
  },
});
