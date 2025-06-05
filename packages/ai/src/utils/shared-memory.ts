import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

// Singleton instance for shared memory
let sharedMemoryInstance: Memory | null = null;

/**
 * Get a shared Memory instance with PostgresStore
 * This prevents creating duplicate database connections
 */
export function getSharedMemory(): Memory {
  if (!sharedMemoryInstance) {
    sharedMemoryInstance = new Memory({
      storage: new PostgresStore({
        connectionString:
          process.env.DATABASE_URL ||
          (() => {
            throw new Error('Unable to connect to the database. Please check your configuration.');
          })(),
        schemaName: 'mastra',
      }),
    });
  }

  return sharedMemoryInstance;
}

/**
 * Reset the shared memory instance (useful for testing)
 */
export function resetSharedMemory(): void {
  sharedMemoryInstance = null;
}
