#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getClient } from './connection.js';

/**
 * Setup script for initializing an empty database
 * This will check if the database is empty and if so, run setup.sql and seed.sql
 */

const DRIZZLE_DIR = './drizzle';
const SETUP_SQL_FILE = join(DRIZZLE_DIR, 'database_dump.sql');

/**
 * Check if the database is empty by looking for any user tables
 */
async function isDatabaseEmpty(): Promise<boolean> {
  const client = getClient();

  try {
    console.log('🔍 Checking if database is empty...');

    // Query to check for any tables in the public schema (excluding system tables)
    const result = await client`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableCount = Number.parseInt((result[0]?.table_count as string) || '0');
    console.log(`📊 Found ${tableCount} tables in public schema`);

    if (tableCount === 0) {
      return true;
    }

    // If there are tables, check if they have any data
    const dataCheck = await client`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as insert_count,
        n_tup_upd as update_count,
        n_tup_del as delete_count
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const totalRows = dataCheck.reduce((sum, table) => {
      const inserts = Number.parseInt(table.insert_count as string) || 0;
      const updates = Number.parseInt(table.update_count as string) || 0;
      const deletes = Number.parseInt(table.delete_count as string) || 0;
      return sum + inserts + updates + deletes;
    }, 0);

    console.log(`📈 Total data operations across all tables: ${totalRows}`);

    // Consider database empty if no data operations have occurred
    return totalRows === 0;
  } catch (error) {
    console.error('❌ Error checking database state:', error);
    // If we can't check, assume it's not empty to be safe
    return false;
  }
}

/**
 * Execute PostgreSQL dump file (with COPY statements) using psql
 */
async function executePgDumpFile(filePath: string, description: string): Promise<void> {
  try {
    console.log(`📄 Executing ${description} using psql: ${filePath}`);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log(`⚡ Running psql to execute ${description}...`);

    // Use psql to execute the file with COPY statements
    execSync(`psql "${databaseUrl}" -f "${filePath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log(`✅ ${description} executed successfully`);
  } catch (error) {
    console.error(`❌ Failed to execute ${description}:`, error);

    // Fallback: try with our manual approach but ignore COPY errors
    console.log(`🔄 Trying fallback approach for ${description}...`);
    try {
      await executeSqlFileWithFallback(filePath, description);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

/**
 * Fallback execution for PostgreSQL dump files (ignore COPY errors)
 */
async function executeSqlFileWithFallback(filePath: string, description: string): Promise<void> {
  const client = getClient();

  try {
    console.log(`📄 Reading ${description} with fallback approach from: ${filePath}`);
    const sqlContent = readFileSync(filePath, 'utf-8');

    console.log(`⚡ Executing ${description} with fallback...`);

    // Split by lines and process more carefully
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    let successCount = 0;
    let warningCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      // Skip problematic COPY sections
      if (trimmedLine.startsWith('COPY ') || trimmedLine === '\\.') {
        continue;
      }

      currentStatement = `${currentStatement}${trimmedLine} `;

      // Execute when we hit a semicolon
      if (trimmedLine.endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement && statement !== ';') {
          try {
            await client.unsafe(statement);
            successCount++;
            if (successCount % 50 === 0) {
              console.log(`   ✓ Successfully executed ${successCount} statements`);
            }
          } catch (statementError) {
            warningCount++;
            // Only log first few warnings to avoid spam
            if (warningCount <= 5) {
              console.warn(
                `⚠️  Warning: Statement failed (${warningCount}):`,
                `${statement.slice(0, 100)}...`
              );
              if (warningCount <= 3) {
                console.warn(`   Error: ${statementError}`);
              }
            }
          }
        }
        currentStatement = '';
      }
    }

    console.log(
      `✅ ${description} fallback completed: ${successCount} successful, ${warningCount} warnings`
    );
  } catch (error) {
    console.error(`❌ Failed to execute ${description} with fallback:`, error);
    throw error;
  }
}

/**
 * Initialize an empty database with setup and seed data
 */
async function initializeEmptyDatabase(): Promise<void> {
  console.log('🚀 Initializing empty database...\n');

  try {
    // Step 1: Run database_dump.sql using psql (since it contains COPY statements)
    await executePgDumpFile(SETUP_SQL_FILE, 'database dump');

    // Step 2: Run drizzle migrations
    console.log('🔄 Running drizzle migrations...');
    try {
      execSync('npm run db:migrate', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('✅ Drizzle migrations completed successfully');
    } catch (migrationError) {
      console.error('❌ Failed to run drizzle migrations:', migrationError);
      throw migrationError;
    }

    console.log('🎉 Database initialization complete!');
    console.log('\nYour database now contains:');
    console.log('• Authentication users and identities');
    console.log('• Sample organization data');
    console.log('• Test metrics, dashboards, and collections');
    console.log('• Asset permissions and search data');
    console.log('• Chat conversations and more');
    console.log('\nNext steps:');
    console.log('1. Open Drizzle Studio to explore: bun run db:studio');
    console.log('2. Run your application to start using the seeded data');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your DATABASE_URL is set correctly');
    console.log('2. Ensure your database is accessible and empty');
    console.log('3. Check that database_dump.sql file exists');
    console.log('4. Verify you have the necessary database permissions');
    console.log('5. Make sure psql is installed and available in PATH');
    process.exit(1);
  }
}

/**
 * Main setup function
 */
async function setupDatabase(): Promise<void> {
  console.log('🔧 Buster Database Setup\n');

  try {
    const isEmpty = await isDatabaseEmpty();

    if (isEmpty) {
      console.log('✨ Database is empty - proceeding with initialization\n');
      await initializeEmptyDatabase();
    } else {
      console.log('⚠️  Database is not empty!');
      console.log('\nThe database contains existing tables or data.');
      console.log('This setup script only runs on empty databases to prevent data loss.\n');
      console.log('If you want to reset the database:');
      console.log('1. Drop all tables manually');
      console.log('2. Or create a new empty database');
      console.log('3. Then run this setup script again\n');
      console.log('Existing database tools:');
      console.log('• Generate migration: bun run db:generate');
      console.log('• Run migrations: bun run db:migrate');
      console.log('• Open studio: bun run db:studio');
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

/**
 * Force initialization (skip empty check)
 */
async function forceInitialization(): Promise<void> {
  console.log('⚠️  FORCE MODE: Skipping empty database check\n');
  console.log('🚨 WARNING: This will attempt to run setup.sql and seed.sql');
  console.log('🚨 This may cause errors if tables already exist!\n');

  await initializeEmptyDatabase();
}

/**
 * Show database status
 */
async function showStatus(): Promise<void> {
  const client = getClient();

  try {
    console.log('📊 Database Status Report\n');

    // Get table count
    const tables = await client`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    console.log(`📋 Tables in public schema: ${tables[0]?.table_count || 0}`);

    // Get detailed table info if tables exist
    if (Number.parseInt((tables[0]?.table_count as string) || '0') > 0) {
      const tableDetails = await client`
        SELECT 
          t.table_name,
          COALESCE(s.n_tup_ins, 0) as insert_count,
          COALESCE(s.n_tup_upd, 0) as update_count,
          COALESCE(s.n_tup_del, 0) as delete_count
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `;

      console.log('\n📈 Table Activity:');
      for (const table of tableDetails) {
        const activity =
          Number.parseInt(table.insert_count as string) +
          Number.parseInt(table.update_count as string) +
          Number.parseInt(table.delete_count as string);
        console.log(`  ${table.table_name}: ${activity} operations`);
      }
    }

    const isEmpty = await isDatabaseEmpty();
    console.log(`\n💡 Database is ${isEmpty ? 'EMPTY' : 'NOT EMPTY'}`);
  } catch (error) {
    console.error('❌ Failed to get database status:', error);
  }
}

// Export functions for programmatic use
export { setupDatabase, initializeEmptyDatabase, isDatabaseEmpty, showStatus, forceInitialization };

// CLI usage
if (import.meta.main) {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
    case undefined:
      await setupDatabase();
      break;
    case 'force':
      await forceInitialization();
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log('🔧 Buster Database Setup\n');
      console.log('Usage: bun run src/setup.ts [command]\n');
      console.log('Commands:');
      console.log('  setup (default) - Setup database if empty');
      console.log('  force           - Force setup without empty check');
      console.log('  status          - Show database status');
      console.log('\nExamples:');
      console.log('  bun run src/setup.ts');
      console.log('  bun run src/setup.ts setup');
      console.log('  bun run src/setup.ts status');
      console.log('  bun run src/setup.ts force');
      process.exit(1);
  }
}
