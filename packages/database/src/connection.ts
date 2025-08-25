import { DATABASE_KEYS, SHARED_KEYS, getSecret } from '@buster/secrets';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Helper to safely get secret
async function getEnvValue(key: string, defaultValue?: string): Promise<string | undefined> {
  try {
    return await getSecret(key);
  } catch {
    return defaultValue;
  }
}

// Environment validation
async function validateEnvironment(): Promise<string> {
  const isTest = (await getEnvValue(SHARED_KEYS.NODE_ENV)) === 'test';
  const isProduction = (await getEnvValue(SHARED_KEYS.NODE_ENV)) === 'production';
  const dbUrl = await getEnvValue(DATABASE_KEYS.DATABASE_URL);

  // Use default local database URL if none provided
  if (!dbUrl) {
    const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
    console.warn(`DATABASE_URL not set - using default: ${defaultUrl}`);
    return defaultUrl;
  }

  // Prevent accidental production database usage in tests
  const allowProdInTests = await getEnvValue('ALLOW_PROD_DB_IN_TESTS'); // Not in constants - rarely used
  if (isTest && dbUrl.includes('prod') && !allowProdInTests) {
    throw new Error(
      'Production database detected in test environment. Set ALLOW_PROD_DB_IN_TESTS=true to override.'
    );
  }

  // Warn about non-pooled connections in production
  const poolSize = await getEnvValue('DATABASE_POOL_SIZE'); // Not in constants - optional config
  if (isProduction && !poolSize) {
    console.warn('DATABASE_POOL_SIZE not set - using default pool size of 100');
  }

  return dbUrl;
}

// Initialize the database pool
export async function initializePool<T extends Record<string, postgres.PostgresType>>(
  config: postgres.Options<T> | undefined = {}
): Promise<PostgresJsDatabase> {
  const connectionString = await validateEnvironment();

  const poolSizeStr = await getEnvValue('DATABASE_POOL_SIZE'); // Not in constants - optional config
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
export async function getDb(): Promise<PostgresJsDatabase> {
  if (!globalDb) {
    return await initializePool();
  }
  return globalDb;
}

// Get the raw postgres client
export async function getClient(): Promise<postgres.Sql> {
  if (!globalPool) {
    await initializePool();
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
    const client = await getClient();
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

// Export the database initialization promise
export const dbInitialized = getDb();

// Export a synchronous database instance (will throw if not initialized)
// This maintains backwards compatibility for existing code
export const db = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop) {
    if (!globalDb) {
      throw new Error(
        'Database not initialized. Import and await dbInitialized first, or use getSyncDb() after initialization.'
      );
    }
    return Reflect.get(globalDb, prop);
  },
  has(_target, prop) {
    if (!globalDb) {
      throw new Error('Database not initialized. Import and await dbInitialized first.');
    }
    return prop in globalDb;
  },
  ownKeys(_target) {
    if (!globalDb) {
      throw new Error('Database not initialized.');
    }
    return Reflect.ownKeys(globalDb);
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (!globalDb) {
      throw new Error('Database not initialized.');
    }
    return Reflect.getOwnPropertyDescriptor(globalDb, prop);
  },
});
