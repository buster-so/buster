import { defineConfig } from 'drizzle-kit';

import { DATABASE_KEYS } from '@buster/secrets';

// For drizzle-kit CLI usage, we need to use process.env directly
// since the CLI runs synchronously and can't await async operations
const connectionString = process.env[DATABASE_KEYS.DATABASE_URL];

if (!connectionString) {
  throw new Error(`${DATABASE_KEYS.DATABASE_URL} environment variable is not defined`);
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString || '',
  },
  verbose: true,
  strict: true,
});
