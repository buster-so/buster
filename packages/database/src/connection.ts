import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Load environment variables from the root .env file
import { config } from 'dotenv';
config({ path: join(process.cwd(), '.env') });

// Pool configuration interface
export interface PoolConfig {
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
  prepare?: boolean;
}

// Default pool configuration
const defaultPoolConfig: PoolConfig = {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 30,
  prepare: false,
};

// Global pool instance
let globalPool: postgres.Sql | null = null;
let globalDb: PostgresJsDatabase | null = null;

// Initialize the database pool
export function initializePool(config: PoolConfig = {}): PostgresJsDatabase {
  const connectionString = process.env.DATABASE_URL || '';

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (globalPool && globalDb) {
    return globalDb;
  }

  const poolConfig = { ...defaultPoolConfig, ...config };

  // Create postgres client with pool configuration
  globalPool = postgres(connectionString, {
    max: poolConfig.max,
    idle_timeout: poolConfig.idle_timeout,
    connect_timeout: poolConfig.connect_timeout,
    prepare: poolConfig.prepare,
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

// Export the default database instance
export const db = getDb();
