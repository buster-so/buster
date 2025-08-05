/**
 * Error Recovery Utilities for Extreme Resilience
 *
 * This module provides comprehensive error handling and recovery utilities
 * designed to make the docs agent EXTREMELY resilient. The primary goal is
 * to ensure the agent never terminates due to tool errors, instead providing
 * graceful degradation and intelligent retry strategies.
 */

import { z } from 'zod';

/**
 * Error classification types
 */
export type ErrorType =
  | 'NETWORK_ERROR'
  | 'FILESYSTEM_ERROR'
  | 'SANDBOX_ERROR'
  | 'PERMISSION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RESOURCE_EXHAUSTED'
  | 'INVALID_INPUT'
  | 'UNKNOWN_ERROR';

export type RecoveryStrategy =
  | 'RETRY_WITH_BACKOFF'
  | 'RETRY_WITH_ALTERNATIVE'
  | 'GRACEFUL_DEGRADATION'
  | 'SKIP_AND_CONTINUE'
  | 'FALLBACK_MODE';

/**
 * Error classification configuration
 */
export interface ErrorClassification {
  type: ErrorType;
  recoverable: boolean;
  strategy: RecoveryStrategy;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  exponentialBackoff?: boolean;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Result type for resilient operations
 */
export interface ResilientResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: ErrorType;
  attemptCount: number;
  recoveryStrategy?: RecoveryStrategy;
  fallbackUsed?: boolean;
  warnings?: string[];
}

/**
 * Default error classifications
 */
const ERROR_CLASSIFICATIONS: Record<string, ErrorClassification> = {
  // Network and connection errors
  ECONNREFUSED: {
    type: 'NETWORK_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  },
  ENOTFOUND: {
    type: 'NETWORK_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 8000,
  },
  ETIMEDOUT: {
    type: 'TIMEOUT_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 3,
    baseDelayMs: 5000,
    maxDelayMs: 15000,
  },

  // Filesystem errors
  ENOENT: {
    type: 'FILESYSTEM_ERROR',
    recoverable: true,
    strategy: 'GRACEFUL_DEGRADATION',
    maxRetries: 1,
    baseDelayMs: 500,
    maxDelayMs: 1000,
  },
  EACCES: {
    type: 'PERMISSION_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_ALTERNATIVE',
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 3000,
  },
  ENOSPC: {
    type: 'RESOURCE_EXHAUSTED',
    recoverable: true,
    strategy: 'GRACEFUL_DEGRADATION',
    maxRetries: 1,
    baseDelayMs: 2000,
    maxDelayMs: 5000,
  },

  // Sandbox specific errors
  'exit code 127': {
    type: 'SANDBOX_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 8000,
  },
  'command not found': {
    type: 'SANDBOX_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_ALTERNATIVE',
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 3000,
  },
  sandbox: {
    type: 'SANDBOX_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 4,
    baseDelayMs: 1500,
    maxDelayMs: 12000,
  },

  // Resource errors
  EMFILE: {
    type: 'RESOURCE_EXHAUSTED',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 3,
    baseDelayMs: 3000,
    maxDelayMs: 10000,
  },
  ENFILE: {
    type: 'RESOURCE_EXHAUSTED',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 3,
    baseDelayMs: 3000,
    maxDelayMs: 10000,
  },
};

/**
 * Classifies an error and returns appropriate recovery strategy
 */
export function classifyError(error: Error | string): ErrorClassification {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? '' : error.stack || '';
  const combinedText = `${errorMessage} ${errorStack}`.toLowerCase();

  // Check for specific error patterns
  for (const [pattern, classification] of Object.entries(ERROR_CLASSIFICATIONS)) {
    if (combinedText.includes(pattern.toLowerCase())) {
      return classification;
    }
  }

  // Default classification for unknown errors
  return {
    type: 'UNKNOWN_ERROR',
    recoverable: true,
    strategy: 'RETRY_WITH_BACKOFF',
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
  };
}

/**
 * Calculates delay for retry with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  exponentialBackoff = true,
  jitter = true
): number {
  let delay = exponentialBackoff
    ? Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
    : baseDelayMs;

  if (jitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitterAmount = delay * 0.25;
    delay += (Math.random() - 0.5) * 2 * jitterAmount;
  }

  return Math.max(delay, 0);
}

/**
 * Sleep utility with proper Promise handling
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an operation with aggressive retry strategy
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<ResilientResult<T>> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    exponentialBackoff = true,
    jitter = true,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let attemptCount = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    attemptCount = attempt;

    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attemptCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, don't retry
      if (attempt > maxRetries) {
        break;
      }

      // Classify error to determine if we should retry
      const classification = classifyError(lastError);
      if (!classification.recoverable) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, exponentialBackoff, jitter);

      if (onRetry) {
        try {
          onRetry(attempt, lastError);
        } catch {
          // Ignore errors in retry callback
        }
      }

      await sleep(delay);
    }
  }

  // All retries failed
  const classification = classifyError(lastError!);
  return {
    success: false,
    error: lastError!.message,
    errorType: classification.type,
    attemptCount,
    recoveryStrategy: classification.strategy,
  };
}

/**
 * Wraps an operation with intelligent error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  context?: string
): Promise<ResilientResult<T>> {
  const result = await withRetry(operation, {
    onRetry: (attempt, error) => {
      console.warn(
        `[ErrorRecovery] Retry attempt ${attempt} for ${context || 'operation'}: ${error.message}`
      );
    },
  });

  // If primary operation failed and we have a fallback, try it
  if (!result.success && fallback) {
    console.warn(
      `[ErrorRecovery] Primary operation failed for ${context || 'operation'}, trying fallback`
    );

    try {
      const fallbackResult = await fallback();
      return {
        success: true,
        data: fallbackResult,
        attemptCount: result.attemptCount,
        fallbackUsed: true,
        warnings: [`Primary operation failed, used fallback: ${result.error}`],
      };
    } catch (fallbackError) {
      const fallbackErrorMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);

      return {
        ...result,
        warnings: [...(result.warnings || []), `Fallback also failed: ${fallbackErrorMessage}`],
      };
    }
  }

  return result;
}

/**
 * Creates a resilient wrapper around any async function
 * This is the key function for making tools extremely resilient
 */
export function createResilientWrapper<TInput, TOutput>(
  toolFunction: (input: TInput) => Promise<TOutput>,
  options: {
    toolName: string;
    fallback?: (input: TInput) => Promise<TOutput>;
    retryOptions?: RetryOptions;
    gracefulError?: (input: TInput, error: string) => TOutput;
  }
) {
  return async (input: TInput): Promise<TOutput> => {
    const { toolName, fallback, retryOptions, gracefulError } = options;

    const result = await withErrorRecovery(
      () => toolFunction(input),
      fallback ? () => fallback(input) : undefined,
      toolName
    );

    if (result.success && result.data) {
      if (result.warnings?.length) {
        console.warn(`[${toolName}] Operation succeeded with warnings:`, result.warnings);
      }
      return result.data;
    }

    // If we have a graceful error handler, use it
    if (gracefulError) {
      console.error(
        `[${toolName}] All recovery attempts failed, using graceful error handler: ${result.error}`
      );
      return gracefulError(input, result.error || 'Unknown error');
    }

    // Last resort: create a safe error response that won't crash the agent
    console.error(`[${toolName}] All recovery attempts failed: ${result.error}`);
    throw new Error(
      `[${toolName}] Operation failed after ${result.attemptCount} attempts: ${result.error}`
    );
  };
}

/**
 * Validates input using Zod schema with error recovery
 */
export function validateWithRecovery<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): ResilientResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
      attemptCount: 1,
    };
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        : `Validation error: ${error instanceof Error ? error.message : String(error)}`;

    return {
      success: false,
      error: errorMessage,
      errorType: 'INVALID_INPUT',
      attemptCount: 1,
    };
  }
}

/**
 * Creates a safe version of JSON.parse that never throws
 */
export function safeJsonParse<T = unknown>(text: string): ResilientResult<T> {
  try {
    const data = JSON.parse(text) as T;
    return {
      success: true,
      data,
      attemptCount: 1,
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON parse failed: ${error instanceof Error ? error.message : String(error)}`,
      errorType: 'INVALID_INPUT',
      attemptCount: 1,
    };
  }
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Simple circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED',
  };

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeMs = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<ResilientResult<T>> {
    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime < this.recoveryTimeMs) {
        return {
          success: false,
          error: 'Circuit breaker is OPEN - operation blocked',
          errorType: 'RESOURCE_EXHAUSTED',
          attemptCount: 0,
        };
      }
      // Transition to half-open
      this.state.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();

      // Success - reset circuit breaker
      this.state.failures = 0;
      this.state.state = 'CLOSED';

      return {
        success: true,
        data: result,
        attemptCount: 1,
      };
    } catch (error) {
      this.state.failures++;
      this.state.lastFailureTime = Date.now();

      if (this.state.failures >= this.failureThreshold) {
        this.state.state = 'OPEN';
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: 'UNKNOWN_ERROR',
        attemptCount: 1,
      };
    }
  }
}

/**
 * Global circuit breaker for sandbox operations
 */
export const sandboxCircuitBreaker = new CircuitBreaker(3, 30000);

/**
 * Utility to create error-safe versions of common operations
 */
export const SafeOperations = {
  /**
   * Safe file system operations that never throw
   */
  fs: {
    readFile: async (path: string): Promise<ResilientResult<string>> => {
      return withRetry(async () => {
        const fs = await import('node:fs/promises');
        return await fs.readFile(path, 'utf-8');
      });
    },

    writeFile: async (path: string, content: string): Promise<ResilientResult<void>> => {
      return withRetry(async () => {
        const fs = await import('node:fs/promises');
        const pathModule = await import('node:path');

        // Ensure directory exists
        await fs.mkdir(pathModule.dirname(path), { recursive: true });
        await fs.writeFile(path, content, 'utf-8');
      });
    },

    exists: async (path: string): Promise<ResilientResult<boolean>> => {
      try {
        const fs = await import('node:fs/promises');
        await fs.access(path);
        return { success: true, data: true, attemptCount: 1 };
      } catch {
        return { success: true, data: false, attemptCount: 1 };
      }
    },
  },

  /**
   * Safe network operations
   */
  network: {
    fetch: async (url: string, options?: RequestInit): Promise<ResilientResult<Response>> => {
      return withRetry(
        async () => {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        },
        {
          maxRetries: 3,
          baseDelayMs: 2000,
          maxDelayMs: 10000,
        }
      );
    },
  },
};
