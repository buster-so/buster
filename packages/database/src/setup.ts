#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

/**
 * Setup script for working with an existing database
 * This will introspect your existing database and generate the initial schema
 */

const DRIZZLE_DIR = './drizzle';
const SCHEMA_FILE = './src/schema.ts';

async function setupExistingDatabase() {
  console.log('🔍 Setting up Drizzle ORM for existing database...\n');

  // Create drizzle directory if it doesn't exist
  if (!existsSync(DRIZZLE_DIR)) {
    mkdirSync(DRIZZLE_DIR, { recursive: true });
    console.log('✅ Created drizzle directory');
  }

  try {
    // Step 1: Pull the existing database schema
    console.log('📥 Pulling existing database schema...');
    execSync('bun run db:pull', { stdio: 'inherit' });
    console.log('✅ Database schema pulled successfully\n');

    // Step 2: Generate TypeScript schema from the pulled schema
    console.log('🔄 Generating TypeScript schema...');
    execSync('bun run db:generate', { stdio: 'inherit' });
    console.log('✅ TypeScript schema generated\n');

    console.log('🎉 Setup complete! Your existing database has been introspected.');
    console.log('\nNext steps:');
    console.log('1. Review the generated schema in:', SCHEMA_FILE);
    console.log('2. Run migrations with: bun run db:migrate');
    console.log('3. Create seed data with: bun run seed:generate my-seed');
    console.log('4. Run seeds with: bun run seed run');
    console.log('5. Open Drizzle Studio with: bun run db:studio');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your DATABASE_URL is set correctly');
    console.log('2. Ensure your database is accessible');
    console.log('3. Check that you have the necessary permissions');
    process.exit(1);
  }
}

/**
 * Generate a snapshot of the current database state
 * Useful for creating a baseline migration
 */
async function generateSnapshot() {
  console.log('📸 Generating database snapshot...');

  try {
    execSync('bun run db:generate', { stdio: 'inherit' });
    console.log('✅ Snapshot generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate snapshot:', error);
    throw error;
  }
}

/**
 * Validate the current schema against the database
 */
async function validateSchema() {
  console.log('🔍 Validating schema against database...');

  try {
    execSync('bun run db:check', { stdio: 'inherit' });
    console.log('✅ Schema validation passed');
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    console.log('Run `bun run db:pull` to sync with the current database state');
    throw error;
  }
}

// Export functions for programmatic use
export { setupExistingDatabase, generateSnapshot, validateSchema };

// CLI usage
if (import.meta.main) {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupExistingDatabase();
      break;
    case 'snapshot':
      await generateSnapshot();
      break;
    case 'validate':
      await validateSchema();
      break;
    default:
      console.log('Usage: bun run src/setup.ts [setup|snapshot|validate]');
      console.log('  setup    - Setup Drizzle for existing database');
      console.log('  snapshot - Generate current database snapshot');
      console.log('  validate - Validate schema against database');
      process.exit(1);
  }
}
