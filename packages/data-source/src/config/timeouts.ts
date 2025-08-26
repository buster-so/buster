/**
 * Standardized timeout configurations for database operations
 * Optimized for serverless environments (Lambda, Trigger.dev)
 */

import { SHARED_KEYS, getSecret } from '@buster/secrets';

// Helper to safely get optional secrets
async function getOptionalSecret(key: string): Promise<string | undefined> {
  try {
    return await getSecret(key);
  } catch {
    return undefined;
  }
}

// Function to determine if we're in a test environment
async function isTestEnvironment(): Promise<boolean> {
  const nodeEnv = await getOptionalSecret(SHARED_KEYS.NODE_ENV);
  const vitest = await getOptionalSecret('VITEST');
  return nodeEnv === 'test' || vitest === 'true';
}

// Initialize timeout configuration
async function initializeTimeoutConfig() {
  const isTest = await isTestEnvironment();

  return {
    // Connection timeouts
    connection: {
      acquisition: isTest ? 5000 : 15000, // 5s for tests, 15s for production
      health: isTest ? 1000 : 3000, // 1s for tests, 3s for production
      total: isTest ? 10000 : 30000, // 10s for tests, 30s for production
    },

    // Query execution timeouts
    query: {
      validation: isTest ? 5000 : 120000, // 5s for tests, 2 minutes for production
      standard: isTest ? 5000 : 120000, // 5s for tests, 2 minutes for production
      extended: isTest ? 10000 : 180000, // 10s for tests, 3 minutes for production
      default: isTest ? 5000 : 120000, // 5s for tests, 2 minutes for production
    },

    // Retry configuration
    retry: {
      maxAttempts: isTest ? 2 : 3, // Fewer retries in tests
      delays: isTest ? [500, 1000] : [1000, 3000, 6000], // Shorter delays in tests
      timeout: {
        multiplier: 1.5, // Multiply timeout by this on each retry
        max: isTest ? 15000 : 180000, // 15s for tests, 3 minutes for production
      },
    },

    // Serverless-specific
    serverless: {
      maxTotalTime: isTest ? 20000 : 150000, // 20s for tests, 2.5 minutes for production
      connectionReuse: isTest ? 60000 : 300000, // 1 minute for tests, 5 minutes for production
    },
  } as const;
}

// Export the timeout configuration as a promise
export const TIMEOUT_CONFIG = initializeTimeoutConfig();

/**
 * Get timeout for a specific operation type
 */
export async function getOperationTimeout(
  operationType: 'validation' | 'standard' | 'extended' | 'connection',
  isServerless = false
): Promise<number> {
  const config = await TIMEOUT_CONFIG;

  if (isServerless && operationType !== 'connection') {
    // In serverless, cap all query timeouts to ensure completion
    return Math.min(
      config.query[operationType] || config.query.default,
      config.serverless.maxTotalTime
    );
  }

  switch (operationType) {
    case 'connection':
      return config.connection.acquisition;
    case 'validation':
      return config.query.validation;
    case 'standard':
      return config.query.standard;
    case 'extended':
      return config.query.extended;
    default:
      return config.query.default;
  }
}

/**
 * Calculate timeout for retry attempt
 */
export async function getRetryTimeout(attemptNumber: number, baseTimeout: number): Promise<number> {
  const config = await TIMEOUT_CONFIG;
  const multiplier = config.retry.timeout.multiplier ** attemptNumber;
  const timeout = Math.round(baseTimeout * multiplier);
  return Math.min(timeout, config.retry.timeout.max);
}

/**
 * Get delay before retry attempt
 */
export async function getRetryDelay(attemptNumber: number): Promise<number> {
  const config = await TIMEOUT_CONFIG;
  const delay = config.retry.delays[attemptNumber];
  if (delay !== undefined) {
    return delay;
  }
  // Return the last delay in the array as fallback
  const lastDelay = config.retry.delays[config.retry.delays.length - 1];
  return lastDelay !== undefined ? lastDelay : 6000; // Fallback to 6s if something goes wrong
}
