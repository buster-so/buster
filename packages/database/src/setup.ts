#!/usr/bin/env bun

import { exec } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { closePool } from './connection.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute a SQL file against the database using psql command
 */
async function executeSqlFile(filePath: string): Promise<void> {
  try {
    console.log(`📄 Executing SQL file with psql: ${filePath}`);

    const command = `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f "${filePath}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      // psql outputs some info to stderr that isn't actually errors
      console.log(stderr);
    }

    console.log(`✅ Successfully executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing SQL file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Run database migrations using bun run db:migrate
 */
async function runDatabaseMigrations(): Promise<void> {
  try {
    console.log('🚀 Running database migrations...');
    const { stdout, stderr } = await execAsync('bun run db:migrate', {
      cwd: process.cwd(),
    });

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.warn(stderr);
    }

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migrations failed:', error);
    throw error;
  }
}

/**
 * Setup database with migrations, setup.sql, and seed.sql
 */
async function setupDatabase(): Promise<void> {
  try {
    console.log('🔧 Starting database setup...\n');

    // Step 1: Run migrations
    await runDatabaseMigrations();
    console.log('');

    // Step 2: Execute setup.sql
    const setupSqlPath = join(__dirname, '..', 'drizzle', 'setup.sql');
    await executeSqlFile(setupSqlPath);
    console.log('');

    // Step 3: Execute seed.sql
    const seedSqlPath = join(__dirname, '..', 'drizzle', 'seed.sql');
    await executeSqlFile(seedSqlPath);
    console.log('');

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

/**
 * Setup data only (setup.sql)
 */
async function setupData(): Promise<void> {
  try {
    console.log('🔧 Setting up database data...\n');

    const setupSqlPath = join(__dirname, '..', 'drizzle', 'setup.sql');
    await executeSqlFile(setupSqlPath);

    console.log('🎉 Database data setup completed successfully!');
  } catch (error) {
    console.error('❌ Database data setup failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

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

/**
 * Run migrations only
 */
async function migrateOnly(): Promise<void> {
  try {
    console.log('🚀 Running migrations only...\n');

    await runDatabaseMigrations();

    console.log('🎉 Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migrations failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// CLI handling
const command = process.argv[2];

switch (command) {
  case 'run':
  case 'setup':
    await setupDatabase();
    break;
  case 'setup-data':
    await setupData();
    break;
  case 'seed':
    await seedData();
    break;
  case 'migrate':
    await migrateOnly();
    break;
  default:
    console.log(`
🔧 Database Setup Tool

Usage: bun run src/setup.ts <command>

Commands:
  run, setup     Run migrations, setup.sql, and seed.sql (full setup)
  migrate        Run migrations only
  setup-data     Run setup.sql only
  seed           Run seed.sql only

Examples:
  bun run src/setup.ts run          # Full database setup
  bun run src/setup.ts migrate      # Migrations only
  bun run src/setup.ts setup-data   # Setup data only
  bun run src/setup.ts seed         # Seed data only

Available npm scripts:
  npm run db:setup      # Full setup (same as 'run')
  npm run setup:data    # Setup data only
  npm run setup:seed    # Seed data only
  npm run setup:full    # Full setup (same as 'run')
`);
    process.exit(1);
}
