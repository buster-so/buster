import { defineConfig } from 'drizzle-kit';

import { getSecretSync } from '@buster/secrets';

const connectionString = (() => {
  try {
    return getSecretSync('DATABASE_URL');
  } catch {
    return undefined;
  }
})();

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
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
