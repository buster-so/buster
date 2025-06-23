#!/usr/bin/env bun

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool } from '../src/connection';
import { executeSqlFile } from './executeSqlFile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Seed data only (seed.sql)
 */
async function seedData(): Promise<void> {
  try {
    console.log('🌱 Seeding database...\n');

    const seedSqlPath = join(__dirname, '..', 'drizzle', 'seed.sql');
    await executeSqlFile(seedSqlPath);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
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

await seedData();
