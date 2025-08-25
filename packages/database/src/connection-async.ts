import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getSecret } from '@buster/secrets';

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Environment validation
async function validateEnvironment(): Promise<string> {
  const isTest = process.env.NODE_ENV === 'test';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Try to get DATABASE_URL from secrets
  const dbUrl = await getSecret('DATABASE_URL').catch(() => null);

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
  const poolSize = await getSecret('DATABASE_POOL_SIZE').catch(() => null);
  if (isProduction && !poolSize) {
    console.warn('DATABASE_POOL_SIZE not set - using default pool size of 100');
  }

  return dbUrl;
}

// Initialize the database pool with async secrets
export async function initializePoolAsync<T extends Record<string, postgres.PostgresType>>(
  config: postgres.Options<T> | undefined = {}
): Promise<PostgresJsDatabase> {
  const connectionString = await validateEnvironment();

  const poolSizeStr = await getSecret('DATABASE_POOL_SIZE').catch(() => null);
  const poolSize = poolSizeStr ? Number.parseInt(poolSizeStr) : 100;

  if (globalPool && globalDb) {
    return globalDb;
  }

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

// Get the database instance (initializes if not already done)
export async function getDbAsync(): Promise<PostgresJsDatabase> {
  if (!globalDb) {
    return initializePoolAsync();
  }
  return globalDb;
}

// Get the raw postgres client
export async function getClientAsync(): Promise<postgres.Sql> {
  if (!globalPool) {
    await initializePoolAsync();
  }
  if (!globalPool) {
    throw new Error('Failed to initialize database pool');
  }
  return globalPool;
}

// Close the pool (useful for graceful shutdown)
export async function closePoolAsync(): Promise<void> {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
    globalDb = null;
  }
}

// Ping the database to check if connection is possible
export async function dbPingAsync(): Promise<boolean> {
  try {
    const client = await getClientAsync();
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database ping failed:', error);
    return false;
  }
}