import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, '../../../.env') });

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Environment validation
function validateEnvironment(): string {
  const isTest = process.env.NODE_ENV === 'test';
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL;

  // Use default local database URL if none provided
  if (!dbUrl) {
    const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
    console.warn(`DATABASE_URL not set - using default: ${defaultUrl}`);
    return defaultUrl;
  }

  // Prevent accidental production database usage in tests
  if (isTest && dbUrl.includes('prod') && !process.env.ALLOW_PROD_DB_IN_TESTS) {
    throw new Error(
      'Production database detected in test environment. Set ALLOW_PROD_DB_IN_TESTS=true to override.'
    );
  }

  // Warn about non-pooled connections in production
  if (isProduction && !process.env.DATABASE_POOL_SIZE) {
    console.warn('DATABASE_POOL_SIZE not set - using default pool size of 100');
  }

  return dbUrl;
}

// Initialize the database pool
export function initializePool<T extends Record<string, postgres.PostgresType>>(
  config: postgres.Options<T> | undefined = {}
): PostgresJsDatabase {
  const connectionString = validateEnvironment();

  const poolSize = process.env.DATABASE_POOL_SIZE
    ? Number.parseInt(process.env.DATABASE_POOL_SIZE, 10)
    : 100;

  if (globalPool && globalDb) {
    return globalDb;
  }

  // Create postgres client with pool configuration
  // SSL is controlled via the connection string (e.g., ?sslmode=require)
  globalPool = postgres(connectionString, {
    max: poolSize,
    idle_timeout: 30,
    connect_timeout: 30,
    prepare: true,
    ...config,
  });

  // Create drizzle instance
  globalDb = drizzle(globalPool);

  return globalDb;
}

// Get the database instance (initializes if not already done)
export function getDb(): PostgresJsDatabase {
  if (!globalDb) {
    return initializePool();
  }
  return globalDb;
}

// Get the raw postgres client
export function getClient(): postgres.Sql {
  if (!globalPool) {
    initializePool();
  }
  if (!globalPool) {
    throw new Error('Failed to initialize database pool');
  }
  return globalPool;
}

// Close the pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
    globalDb = null;
  }
}

// Ping the database to check if connection is possible
export async function dbPing(): Promise<boolean> {
  try {
    const client = getClient();
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database ping failed:', error);
    return false;
  }
}

// Export the default database instance
export const db = getDb();

export * from './methods';
