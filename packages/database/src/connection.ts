import { DATABASE_KEYS, SHARED_KEYS, getSecretSync } from '@buster/secrets';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Helper to safely get secret synchronously
function getEnvValue(key: string, defaultValue?: string): string | undefined {
  try {
    return getSecretSync(key);
  } catch {
    return defaultValue;
  }
}

// Environment validation (now synchronous)
function validateEnvironment(): string {
  const isTest = getEnvValue(SHARED_KEYS.NODE_ENV) === 'test';
  const isProduction = getEnvValue(SHARED_KEYS.NODE_ENV) === 'production';
  const dbUrl = getEnvValue(DATABASE_KEYS.DATABASE_URL);

  // Use default local database URL if none provided
  if (!dbUrl) {
    const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
    console.warn(`DATABASE_URL not set - using default: ${defaultUrl}`);
    return defaultUrl;
  }

  // Prevent accidental production database usage in tests
  const allowProdInTests = getEnvValue('ALLOW_PROD_DB_IN_TESTS'); // Not in constants - rarely used
  if (isTest && dbUrl.includes('prod') && !allowProdInTests) {
    throw new Error(
      'Production database detected in test environment. Set ALLOW_PROD_DB_IN_TESTS=true to override.'
    );
  }

  // Warn about non-pooled connections in production
  const poolSize = getEnvValue('DATABASE_POOL_SIZE'); // Not in constants - optional config
  if (isProduction && !poolSize) {
    console.warn('DATABASE_POOL_SIZE not set - using default pool size of 100');
  }

  return dbUrl;
}

// Initialize the database pool (now synchronous)
export function initializePool<T extends Record<string, postgres.PostgresType>>(
  config: postgres.Options<T> | undefined = {}
): PostgresJsDatabase {
  if (globalPool && globalDb) {
    return globalDb;
  }

  const connectionString = validateEnvironment();
  const poolSizeStr = getEnvValue('DATABASE_POOL_SIZE'); // Not in constants - optional config
  const poolSize = poolSizeStr ? Number.parseInt(poolSizeStr) : 100;

  // Create postgres client with pool configuration
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

// Get the database instance (initializes if not already done) - now synchronous
export function getDb(): PostgresJsDatabase {
  if (!globalDb) {
    return initializePool();
  }
  return globalDb;
}

// Get the raw postgres client (now synchronous)
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

// Synchronous getter that assumes database is already initialized
export function getSyncDb(): PostgresJsDatabase {
  if (!globalDb) {
    throw new Error('Database not initialized. Call initializePool() first.');
  }
  return globalDb;
}

// Export the database instance - initializes synchronously on first use
export const db: PostgresJsDatabase = getDb();
