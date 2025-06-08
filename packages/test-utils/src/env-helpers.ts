export interface TestEnvironment {
  cleanup: () => Promise<void>;
  reset: () => Promise<void>;
}

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Store original environment variables
  const originalEnv = { ...process.env };

  // Set test-specific environment variables
  process.env.NODE_ENV = 'test';
  // Use DATABASE_URL from .env file loaded by vitest config

  const cleanup = async () => {
    // Restore original environment
    process.env = originalEnv;
  };

  const reset = async () => {
    // Reset to test state without full cleanup
    process.env.NODE_ENV = 'test';
  };

  return {
    cleanup,
    reset,
  };
}

export function withTestEnv<T>(testFn: () => Promise<T>): () => Promise<T> {
  return async () => {
    const env = await setupTestEnvironment();
    try {
      return await testFn();
    } finally {
      await env.cleanup();
    }
  };
}

/**
 * Cleanup function for test environments
 * Currently a no-op as vitest handles environment cleanup
 */
export async function cleanupTestEnvironment(): Promise<void> {
  // No cleanup needed - vitest handles environment variables
}
