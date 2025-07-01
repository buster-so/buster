import type { RetryableError } from './types';

/**
 * Custom error class for retry with healing functionality
 * This error is thrown to trigger a retry with a healing message
 */
export class RetryWithHealingError extends Error {
  public readonly retryableError: RetryableError;

  constructor(retryableError: RetryableError) {
    super('RETRY_WITH_HEALING');
    this.name = 'RetryWithHealingError';
    this.retryableError = retryableError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RetryWithHealingError);
    }
  }
}

/**
 * Type guard to check if an error is a RetryWithHealingError
 */
export function isRetryWithHealingError(error: unknown): error is RetryWithHealingError {
  return error instanceof RetryWithHealingError;
}
