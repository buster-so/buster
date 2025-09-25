import { z } from 'zod';
import { calculateBackoffDelay, sleep } from './with-agent-retry';

// ===== Core Types =====

/**
 * Options for retry behavior
 */
const StepRetryOptionsSchema = z.object({
  stepName: z.string().describe('Name of the step for logging'),
  maxAttempts: z.number().optional().describe('Maximum number of retry attempts'),
  baseDelayMs: z.number().optional().describe('Base delay in milliseconds for exponential backoff'),
  onRetry: z
    .function()
    .args(z.number(), z.unknown())
    .returns(z.void())
    .optional()
    .describe('Callback function called on each retry'),
});

export type StepRetryOptions = z.infer<typeof StepRetryOptionsSchema>;

/**
 * Wraps an async function with retry logic for all errors
 * Uses exponential backoff between retries
 *
 * @param stepFn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 */
export async function withStepRetry<T>(
  stepFn: () => Promise<T>,
  options: StepRetryOptions
): Promise<T> {
  const { stepName, maxAttempts = 3, baseDelayMs = 2000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.info(`[${stepName}] Attempt ${attempt}/${maxAttempts}`);
      return await stepFn();
    } catch (error) {
      lastError = error;

      console.error(`[${stepName}] Error on attempt ${attempt}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        console.error(`[${stepName}] Failed after ${maxAttempts} attempts`);
        throw error;
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateBackoffDelay(attempt, baseDelayMs);
      console.info(`[${stepName}] Retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);

      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      await sleep(delayMs);
    }
  }

  // This should never be reached because the loop always returns or throws
  // But TypeScript needs this for completeness
  throw lastError;
}

/**
 * Creates a retryable version of an async function
 * Useful for creating reusable wrapped functions
 *
 * @param fn - The async function to make retryable
 * @param options - Default retry options
 * @returns A new function with retry logic built in
 */
export function createRetryableStep<TParams extends unknown[], TResult>(
  fn: (...args: TParams) => Promise<TResult>,
  defaultOptions: StepRetryOptions
): (...args: TParams) => Promise<TResult> {
  return async (...args: TParams): Promise<TResult> => {
    return withStepRetry(() => fn(...args), defaultOptions);
  };
}

/**
 * Runs multiple async functions in parallel with retry logic
 * Each function gets its own retry attempts
 *
 * @param steps - Array of step configurations
 * @returns Promise resolving to array of results
 */
export async function runStepsWithRetry<T extends readonly unknown[]>(
  steps: {
    [K in keyof T]: {
      stepFn: () => Promise<T[K]>;
      options: StepRetryOptions;
    };
  }
): Promise<T> {
  const promises = steps.map((step) => withStepRetry(step.stepFn, step.options));
  return Promise.all(promises) as Promise<{ [K in keyof T]: T[K] }>;
}
