#!/usr/bin/env bun

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function markBaselineAsApplied() {
  console.log('🔄 Starting Diesel to Drizzle baseline migration...');

  // Connect to database
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check if we already have Drizzle migrations table
    const drizzleMigrationsResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      );
    `;

    const drizzleMigrationsExists = drizzleMigrationsResult[0]?.exists;

    if (drizzleMigrationsExists) {
      console.log('⚠️  Drizzle migrations table already exists. Checking state...');

      const migrations = await sql`
        SELECT * FROM drizzle.__drizzle_migrations 
        ORDER BY created_at;
      `;

      if (migrations.length > 0) {
        console.log(`📋 Found ${migrations.length} existing Drizzle migrations:`);
        for (const migration of migrations) {
          console.log(`   - ${(migration as any).hash}: ${(migration as any).created_at}`);
        }
        console.log('✅ Baseline already established. No action needed.');
        return;
      }
    }

    // Check current Diesel migration state
    const dieselMigrationsResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__diesel_schema_migrations'
      );
    `;

    const dieselMigrationsExists = dieselMigrationsResult[0]?.exists;

    if (!dieselMigrationsExists) {
      throw new Error(
        '❌ No Diesel migrations table found. Database may not be properly initialized.'
      );
    }

    const dieselMigrations = await sql`
      SELECT version, run_on FROM public.__diesel_schema_migrations 
      ORDER BY run_on;
    `;

    console.log(`📋 Found ${dieselMigrations.length} Diesel migrations`);
    console.log(`   Latest: ${dieselMigrations[dieselMigrations.length - 1]?.version}`);

    // Find the baseline migration file
    const migrationsDir = path.join(process.cwd(), 'drizzle');
    const migrationFiles = await readdir(migrationsDir).catch(() => []);

    const baselineMigration = migrationFiles.find(
      (file) => file.includes('baseline') || file.startsWith('0000_')
    );

    if (!baselineMigration) {
      console.log('⚠️  No baseline migration found. Generating one...');
      console.log('Please run: bun run db:generate --name baseline_from_diesel');
      return;
    }

    console.log(`📁 Found baseline migration: ${baselineMigration}`);

    // Create drizzle schema if it doesn't exist
    await sql`CREATE SCHEMA IF NOT EXISTS drizzle;`;

    // Create or recreate drizzle migrations table with proper constraints
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at bigint
      );
    `;

    // Check if we need to add the unique constraint (in case table existed without it)
    const constraintExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%hash%'
      );
    `;

    if (!constraintExists[0]?.exists) {
      console.log('🔧 Adding unique constraint to hash column...');
      try {
        await sql`
          ALTER TABLE drizzle.__drizzle_migrations 
          ADD CONSTRAINT __drizzle_migrations_hash_unique UNIQUE (hash);
        `;
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Read the migration file to get its hash
    const migrationPath = path.join(migrationsDir, baselineMigration);
    await readFile(migrationPath, 'utf-8');

    // Generate a hash for the baseline migration (simplified)
    const hash = baselineMigration.replace('.sql', '');
    const timestamp = Date.now();

    // Mark the baseline migration as applied without running it
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${timestamp})
      ON CONFLICT (hash) DO NOTHING;
    `;

    console.log('✅ Baseline migration marked as applied');
    console.log('🎉 Diesel to Drizzle baseline established successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the setup: bun run db:check');
    console.log('2. Make a test schema change in src/schema.ts');
    console.log('3. Generate migration: bun run db:generate');
    console.log('4. Apply migration: bun run db:migrate');
  } catch (error) {
    console.error('❌ Error during baseline setup:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

async function validateBaseline() {
  console.log('🔍 Validating baseline setup...');

  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check both migration tables exist
    const dieselResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '__diesel_schema_migrations'
      );
    `;

    const drizzleResult = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      );
    `;

    const dieselExists = dieselResult[0]?.exists;
    const drizzleExists = drizzleResult[0]?.exists;

    if (!dieselExists) {
      console.log('❌ Diesel migrations table not found');
      return false;
    }

    if (!drizzleExists) {
      console.log('❌ Drizzle migrations table not found');
      return false;
    }

    const dieselCount = await sql`SELECT COUNT(*) FROM public.__diesel_schema_migrations;`;
    const drizzleCount = await sql`SELECT COUNT(*) FROM drizzle.__drizzle_migrations;`;

    console.log(`✅ Diesel migrations: ${dieselCount[0]?.count}`);
    console.log(`✅ Drizzle migrations: ${drizzleCount[0]?.count}`);

    if (drizzleCount[0]?.count === '0') {
      console.log('⚠️  No Drizzle migrations found. Run baseline setup first.');
      return false;
    }

    console.log('✅ Baseline validation successful');
    return true;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  } finally {
    await sql.end();
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'setup':
    await markBaselineAsApplied();
    break;
  case 'validate':
    await validateBaseline();
    break;
  default:
    console.log('Usage: bun run src/baseline.ts [setup|validate]');
    console.log('  setup   - Mark current database state as Drizzle baseline');
    console.log('  validate - Check baseline setup status');
}
