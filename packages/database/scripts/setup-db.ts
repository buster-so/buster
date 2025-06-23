#!/usr/bin/env bun

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool } from '../src/connection';
import { executeSqlFile } from './executeSqlFile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Setup database with migrations, setup.sql, and seed.sql
 */
async function setupDatabase(): Promise<void> {
  try {
    console.log('🔧 Starting database setup...\n');

    // Step 1: Run migrations
    console.log('This assumes that the database is already running and migrations have been run');

    // Step 2: Execute setup.sql
    const setupSqlPath = join(__dirname, '..', 'drizzle', 'setup.sql');
    await executeSqlFile(setupSqlPath);
    console.log('🎉 Database setup completed successfully!');

    console.log('Seeding database has not been run yet');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not defined');
  console.error('Please ensure you have a .env file with DATABASE_URL configured');
  process.exit(1);
}

if (!process.env.SUPABASE_URL) {
  console.error('❌ ERROR: SUPABASE_URL environment variable is not defined');
  console.error('Please ensure you have a .env file with SUPABASE_URL configured');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not defined');
  console.error('Please ensure you have a .env file with SUPABASE_SERVICE_ROLE_KEY configured');
  process.exit(1);
}

await setupDatabase();
