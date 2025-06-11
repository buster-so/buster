import { LibSQLStore } from '@mastra/libsql';
import { ThreadMemory } from '@mastra/memory';

let sharedMemory: ThreadMemory | null = null;

/**
 * Get the shared memory instance for all agents
 * Uses a single LibSQLStore to persist agent conversations
 */
export function getSharedMemory(): ThreadMemory {
  if (!sharedMemory) {
    sharedMemory = new ThreadMemory({
      store: new LibSQLStore({
        url: `file:.mastra/output/memory.db`,
      }),
    });
  }
  return sharedMemory;
}

/**
 * Reset the shared memory instance
 * Useful for testing
 */
export function resetSharedMemory(): void {
  sharedMemory = null;
}