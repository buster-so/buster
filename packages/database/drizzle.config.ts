import { defineConfig } from 'drizzle-kit';

import { DATABASE_KEYS, getSecretSync } from '@buster/secrets';

const connectionString = getSecretSync(DATABASE_KEYS.DATABASE_URL);

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
