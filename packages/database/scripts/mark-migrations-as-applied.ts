#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATABASE_KEYS, getSecret } from '@buster/secrets';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function markMigrationsAsApplied() {
  const connectionString = await getSecret(DATABASE_KEYS.DATABASE_URL);
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🔧 Initializing Drizzle migration tracking...\n');

    // Create the drizzle schema if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS drizzle
    `);

    // Create the __drizzle_migrations table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL NOT NULL,
        hash TEXT NOT NULL,
        created_at BIGINT NULL,
        CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id)
      ) TABLESPACE pg_default
    `);

    // Read the journal to get all migrations
    const journalPath = join(__dirname, '..', 'drizzle', 'meta', '_journal.json');
    const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));

    console.log(`📋 Found ${journal.entries.length} migrations in journal\n`);

    // Mark each migration as applied
    for (const entry of journal.entries) {
      const hash = entry.tag;

      // Check if migration is already marked
      const existing = await db.execute(sql`
        SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}
      `);

      if (existing.length === 0) {
        // Insert with created_at as current timestamp in milliseconds
        const createdAt = Date.now();
        await db.execute(sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${createdAt})
        `);
        console.log(`✅ Marked migration as applied: ${hash}`);
      } else {
        console.log(`⏭️  Migration already marked: ${hash}`);
      }
    }

    console.log('\n🎉 Successfully initialized Drizzle migration tracking!');
    console.log('Future migrations will run normally.');
  } catch (error) {
    console.error('❌ Failed to mark migrations as applied:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
await markMigrationsAsApplied();
