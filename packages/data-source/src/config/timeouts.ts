/**
 * Standardized timeout configurations for database operations
 * Optimized for serverless environments (Lambda, Trigger.dev)
 */

// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export const TIMEOUT_CONFIG = {
  // Connection timeouts
  connection: {
    acquisition: isTestEnvironment ? 5000 : 15000, // 5s for tests, 15s for production
    health: isTestEnvironment ? 1000 : 3000, // 1s for tests, 3s for production
    total: isTestEnvironment ? 10000 : 30000, // 10s for tests, 30s for production
  },

  // Query execution timeouts
  query: {
    validation: isTestEnvironment ? 5000 : 120000, // 5s for tests, 2 minutes for production
    standard: isTestEnvironment ? 5000 : 120000, // 5s for tests, 2 minutes for production
    extended: isTestEnvironment ? 10000 : 180000, // 10s for tests, 3 minutes for production
    default: isTestEnvironment ? 5000 : 120000, // 5s for tests, 2 minutes for production
  },

  // Retry configuration
  retry: {
    maxAttempts: isTestEnvironment ? 2 : 3, // Fewer retries in tests
    delays: isTestEnvironment ? [500, 1000] : [1000, 3000, 6000], // Shorter delays in tests
    timeout: {
      multiplier: 1.5, // Multiply timeout by this on each retry
      max: isTestEnvironment ? 15000 : 180000, // 15s for tests, 3 minutes for production
    },
  },

  // Serverless-specific
  serverless: {
    maxTotalTime: isTestEnvironment ? 20000 : 150000, // 20s for tests, 2.5 minutes for production
    connectionReuse: isTestEnvironment ? 60000 : 300000, // 1 minute for tests, 5 minutes for production
  },
} as const;

/**
 * Get timeout for a specific operation type
 */
export function getOperationTimeout(
  operationType: 'validation' | 'standard' | 'extended' | 'connection',
  isServerless = false
): number {
  if (isServerless && operationType !== 'connection') {
    // In serverless, cap all query timeouts to ensure completion
    return Math.min(
      TIMEOUT_CONFIG.query[operationType] || TIMEOUT_CONFIG.query.default,
      TIMEOUT_CONFIG.serverless.maxTotalTime
    );
  }

  switch (operationType) {
    case 'connection':
      return TIMEOUT_CONFIG.connection.acquisition;
    case 'validation':
      return TIMEOUT_CONFIG.query.validation;
    case 'standard':
      return TIMEOUT_CONFIG.query.standard;
    case 'extended':
      return TIMEOUT_CONFIG.query.extended;
    default:
      return TIMEOUT_CONFIG.query.default;
  }
}

/**
 * Calculate timeout for retry attempt
 */
export function getRetryTimeout(attemptNumber: number, baseTimeout: number): number {
  const multiplier = TIMEOUT_CONFIG.retry.timeout.multiplier ** attemptNumber;
  const timeout = Math.round(baseTimeout * multiplier);
  return Math.min(timeout, TIMEOUT_CONFIG.retry.timeout.max);
}

/**
 * Get delay before retry attempt
 */
export function getRetryDelay(attemptNumber: number): number {
  const delay = TIMEOUT_CONFIG.retry.delays[attemptNumber];
  if (delay !== undefined) {
    return delay;
  }
  // Return the last delay in the array as fallback
  const lastDelay = TIMEOUT_CONFIG.retry.delays[TIMEOUT_CONFIG.retry.delays.length - 1];
  return lastDelay !== undefined ? lastDelay : 6000; // Fallback to 6s if something goes wrong
}
