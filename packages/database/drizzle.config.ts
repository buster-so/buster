import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env from workspace root
config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});
