#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { getDb } from '../connection.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface SeedConfig {
  name: string;
  description?: string;
  dependencies?: string[];
  tables: string[];
}

export interface SeedResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  recordsCreated?: number;
}

export type SeedFunction = (db: PostgresJsDatabase) => Promise<SeedResult>;

export interface SeedModule {
  config: SeedConfig;
  seed: SeedFunction;
}

const SEEDS_DIR = './src/seed/scripts';
const SNAPSHOTS_DIR = './src/seed/snapshots';

/**
 * Ensure seed directories exist
 */
function ensureDirectories() {
  if (!existsSync(SEEDS_DIR)) {
    mkdirSync(SEEDS_DIR, { recursive: true });
  }
  if (!existsSync(SNAPSHOTS_DIR)) {
    mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

/**
 * Get all available seed files
 */
export function getAvailableSeeds(): string[] {
  ensureDirectories();
  return readdirSync(SEEDS_DIR)
    .filter(file => extname(file) === '.ts' && !file.endsWith('.d.ts'))
    .map(file => file.replace('.ts', ''))
    .sort();
}

/**
 * Load a seed module
 */
export async function loadSeedModule(seedName: string): Promise<SeedModule> {
  const seedPath = join(process.cwd(), SEEDS_DIR, `${seedName}.ts`);
  
  if (!existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

  try {
    const module = await import(seedPath);
    
    if (!module.config || !module.seed) {
      throw new Error(`Invalid seed module: ${seedName}. Must export 'config' and 'seed'`);
    }

    return module as SeedModule;
  } catch (error) {
    throw new Error(`Failed to load seed module ${seedName}: ${error}`);
  }
}

/**
 * Run a single seed
 */
export async function runSeed(seedName: string, db?: PostgresJsDatabase): Promise<SeedResult> {
  const database = db || getDb();
  const startTime = Date.now();

  try {
    console.log(`🌱 Running seed: ${seedName}`);
    
    const seedModule = await loadSeedModule(seedName);
    const result = await seedModule.seed(database);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Seed completed: ${seedName} (${duration}ms)`);
    
    return {
      ...result,
      duration,
      success: true
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ Seed failed: ${seedName} - ${errorMessage}`);
    
    return {
      name: seedName,
      success: false,
      duration,
      error: errorMessage
    };
  }
}

/**
 * Run multiple seeds with dependency resolution
 */
export async function runSeeds(seedNames: string[], db?: PostgresJsDatabase): Promise<SeedResult[]> {
  const database = db || getDb();
  const results: SeedResult[] = [];
  const executed = new Set<string>();
  
  async function executeSeed(seedName: string): Promise<void> {
    if (executed.has(seedName)) {
      return;
    }

    const seedModule = await loadSeedModule(seedName);
    
    // Execute dependencies first
    if (seedModule.config.dependencies) {
      for (const dep of seedModule.config.dependencies) {
        await executeSeed(dep);
      }
    }

    const result = await runSeed(seedName, database);
    results.push(result);
    executed.add(seedName);
  }

  for (const seedName of seedNames) {
    await executeSeed(seedName);
  }

  return results;
}

/**
 * Run all available seeds
 */
export async function runAllSeeds(db?: PostgresJsDatabase): Promise<SeedResult[]> {
  const availableSeeds = getAvailableSeeds();
  return runSeeds(availableSeeds, db);
}

/**
 * Create a snapshot of current database state
 */
export async function createSnapshot(name: string, tables?: string[]): Promise<void> {
  ensureDirectories();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotName = `${name}-${timestamp}`;
  const snapshotPath = join(SNAPSHOTS_DIR, `${snapshotName}.sql`);

  try {
    console.log(`📸 Creating snapshot: ${snapshotName}`);

    // Use pg_dump to create a data-only dump
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    let pgDumpCmd = `pg_dump "${databaseUrl}" --data-only --inserts`;
    
    if (tables && tables.length > 0) {
      const tableArgs = tables.map(table => `--table=${table}`).join(' ');
      pgDumpCmd += ` ${tableArgs}`;
    }

    pgDumpCmd += ` > "${snapshotPath}"`;

    execSync(pgDumpCmd, { stdio: 'inherit' });
    
    console.log(`✅ Snapshot created: ${snapshotPath}`);
    
    // Also create a TypeScript seed file from this snapshot
    await createSeedFromSnapshot(snapshotName, snapshotPath, tables);
    
  } catch (error) {
    console.error(`❌ Failed to create snapshot: ${error}`);
    throw error;
  }
}

/**
 * Create a TypeScript seed file from a SQL snapshot
 */
async function createSeedFromSnapshot(name: string, sqlPath: string, tables?: string[]): Promise<void> {
  const seedPath = join(SEEDS_DIR, `${name}.ts`);
  
  const seedContent = `import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import type { SeedConfig, SeedResult } from '../index.js';

export const config: SeedConfig = {
  name: '${name}',
  description: 'Generated from database snapshot on ${new Date().toISOString()}',
  tables: ${JSON.stringify(tables || [], null, 2)}
};

export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  console.log('🌱 Running snapshot seed: ${name}');
  
  try {
    // Execute the SQL snapshot
    // Note: You may need to modify this based on your specific data
    const sqlContent = await Bun.file('${sqlPath}').text();
    
    // Split by statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let recordsCreated = 0;
    
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('insert')) {
        await db.execute(sql.raw(statement));
        recordsCreated++;
      }
    }
    
    return {
      name: '${name}',
      success: true,
      duration: 0, // Will be set by runner
      recordsCreated
    };
  } catch (error) {
    throw new Error(\`Failed to run snapshot seed: \${error}\`);
  }
}
`;

  writeFileSync(seedPath, seedContent);
  console.log(`📝 Created seed file: ${seedPath}`);
}

/**
 * List all available snapshots
 */
export function getAvailableSnapshots(): string[] {
  ensureDirectories();
  return readdirSync(SNAPSHOTS_DIR)
    .filter(file => extname(file) === '.sql')
    .map(file => file.replace('.sql', ''))
    .sort();
}

/**
 * Clean up old snapshots (keep only the latest N)
 */
export function cleanupSnapshots(keep = 5): void {
  const snapshots = getAvailableSnapshots();
  const toDelete = snapshots.slice(0, -keep);
  
  for (const snapshot of toDelete) {
    const sqlPath = join(SNAPSHOTS_DIR, `${snapshot}.sql`);
    const tsPath = join(SEEDS_DIR, `${snapshot}.ts`);
    
    try {
      if (existsSync(sqlPath)) {
        execSync(`rm "${sqlPath}"`);
      }
      if (existsSync(tsPath)) {
        execSync(`rm "${tsPath}"`);
      }
      console.log(`🗑️  Cleaned up snapshot: ${snapshot}`);
    } catch (error) {
      console.warn(`⚠️  Failed to clean up snapshot ${snapshot}: ${error}`);
    }
  }
} 