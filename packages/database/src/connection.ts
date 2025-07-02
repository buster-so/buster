import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Pool configuration interface
export interface PoolConfig {
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
  prepare?: boolean;
}

// Default pool configuration
const defaultPoolConfig: PoolConfig = {
  max: 100,
  idle_timeout: 30,
  connect_timeout: 30,
  prepare: true,
};

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Initialize the database pool
export function initializePool(config: PoolConfig = {}): PostgresJsDatabase {
  const connectionString = process.env.DATABASE_URL;
  const poolSize = process.env.DATABASE_POOL_SIZE
    ? Number.parseInt(process.env.DATABASE_POOL_SIZE)
    : 100;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (globalPool && globalDb) {
    return globalDb;
  }

  const poolConfig = { ...defaultPoolConfig, ...config, max: poolSize };

  // Create postgres client with pool configuration
  globalPool = postgres(connectionString, poolConfig);

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
