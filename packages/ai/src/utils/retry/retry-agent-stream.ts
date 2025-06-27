import type { ToolSet } from 'ai';
import {
  APICallError,
  EmptyResponseBodyError,
  InvalidResponseDataError,
  JSONParseError,
  NoContentGeneratedError,
  NoSuchToolError,
  RetryError,
  ToolExecutionError,
} from 'ai';
import { healStreamingToolError, isHealableStreamError } from '../streaming/tool-healing';
import { compressConversationHistory, shouldCompressHistory } from './context-compression';
import type { RetryConfig, RetryResult, RetryableAgentStreamParams, RetryableError } from './types';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  exponentialBackoff: true,
  maxBackoffMs: 8000, // Max 8 second delay
};

/**
 * Calculates exponential backoff delay with jitter
 */
function calculateBackoffDelay(attemptNumber: number, maxBackoffMs = 8000): number {
  const baseDelay = Math.min(1000 * 2 ** (attemptNumber - 1), maxBackoffMs);
  // Add jitter (±25% randomness)
  const jitter = baseDelay * 0.25 * (Math.random() - 0.5);
  return Math.max(500, baseDelay + jitter); // Minimum 500ms delay
}

/**
 * Sleeps for the specified duration
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Detects if an error is retryable using AI SDK error types
 */
export function detectRetryableError(error: unknown): RetryableError | null {
  // Handle NoSuchToolError
  if (NoSuchToolError.isInstance(error)) {
    return {
      type: 'no-such-tool',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: 'toolName' in error ? String(error.toolName) : 'unknown',
            result: {
              error: `Tool "${'toolName' in error ? error.toolName : 'unknown'}" is not available. Please use one of the available tools instead.`,
            },
          },
        ],
      },
    };
  }

  // Handle InvalidToolArgumentsError - AI SDK throws this for bad arguments
  if (error instanceof Error && error.name === 'AI_InvalidToolArgumentsError') {
    return {
      type: 'invalid-tool-arguments',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: 'toolName' in error ? String(error.toolName) : 'unknown',
            result: {
              error:
                'Invalid tool arguments provided. Please check the required parameters and try again.',
            },
          },
        ],
      },
    };
  }

  // Handle API call errors (network, rate limits, server errors)
  if (APICallError.isInstance(error)) {
    // Rate limit errors
    if (error.statusCode === 429) {
      return {
        type: 'rate-limit',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: 'Rate limit reached, please wait and try again.',
        },
      };
    }

    // Server errors (5xx)
    if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) {
      return {
        type: 'server-error',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: 'Server temporarily unavailable, retrying...',
        },
      };
    }

    // Network timeout (often no status code)
    if (!error.statusCode || error.cause) {
      return {
        type: 'network-timeout',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: 'Connection timeout, please retry.',
        },
      };
    }
  }

  // Handle empty response body errors
  if (EmptyResponseBodyError.isInstance(error)) {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
      },
    };
  }

  // Handle JSON parsing errors in responses
  if (JSONParseError.isInstance(error)) {
    return {
      type: 'json-parse-error',
      originalError: error,
      healingMessage: {
        role: 'user',
        content:
          'There was an issue with the response format. Please try again with proper formatting.',
      },
    };
  }

  // Handle no content generated errors
  if (NoContentGeneratedError.isInstance(error)) {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
      },
    };
  }

  // Handle retry errors (already wrapped by AI SDK)
  if (RetryError.isInstance(error)) {
    // Extract the last error from retry attempts
    const lastError = error.lastError || error.cause;
    if (lastError) {
      // Try to detect the underlying error type
      return detectRetryableError(lastError);
    }
  }

  // Handle tool execution errors
  if (ToolExecutionError.isInstance(error)) {
    return {
      type: 'invalid-tool-arguments',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: 'toolName' in error ? String(error.toolName) : 'unknown',
            result: {
              error: 'Tool execution failed. Please check your parameters and try again.',
            },
          },
        ],
      },
    };
  }

  return null;
}

/**
 * Executes agent stream with retry logic for recoverable errors
 */
export async function retryableAgentStream<T extends ToolSet>({
  agent,
  messages,
  options,
  retryConfig = DEFAULT_RETRY_CONFIG,
}: RetryableAgentStreamParams<T>): Promise<RetryResult<T>> {
  let conversationHistory = [...messages];
  let lastError: unknown;
  let retryCount = 0;

  while (retryCount <= retryConfig.maxRetries) {
    try {
      // Check for context compression before retry
      if (shouldCompressHistory(conversationHistory)) {
        conversationHistory = compressConversationHistory(conversationHistory);
        // Compressed conversation history due to length
      }

      const stream = await agent.stream(conversationHistory, options);

      // Return successful result
      return {
        stream,
        conversationHistory,
        retryCount,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const retryableError = detectRetryableError(error);
      if (!retryableError || retryCount >= retryConfig.maxRetries) {
        // Not retryable or max retries reached
        throw error;
      }

      // Call retry callback if provided
      if (retryConfig.onRetry) {
        retryConfig.onRetry(retryableError, retryCount + 1);
      }

      // Add healing message to conversation history
      conversationHistory = [...conversationHistory, retryableError.healingMessage];

      // Increment retry count
      retryCount++;

      // Apply exponential backoff if enabled
      if (retryConfig.exponentialBackoff && retryCount <= retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(retryCount, retryConfig.maxBackoffMs);
        // Retrying with exponential backoff
        await sleep(delay);
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry loop exited unexpectedly');
}

/**
 * Enhanced version of retryableAgentStream that includes tool healing support
 * This extends the existing error detection to handle tool-specific healing
 */
export async function retryableAgentStreamWithHealing<T extends ToolSet>({
  agent,
  messages,
  options,
  retryConfig = DEFAULT_RETRY_CONFIG,
}: RetryableAgentStreamParams<T>): Promise<RetryResult<T>> {
  let conversationHistory = [...messages];
  let lastError: unknown;
  let retryCount = 0;

  while (retryCount <= retryConfig.maxRetries) {
    try {
      // Check for context compression before retry
      if (shouldCompressHistory(conversationHistory)) {
        conversationHistory = compressConversationHistory(conversationHistory);
        // Compressed conversation history due to length
      }

      const stream = await agent.stream(conversationHistory, options);

      // Return successful result
      return {
        stream,
        conversationHistory,
        retryCount,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable using existing logic
      const retryableError = detectRetryableError(error);

      // Additionally check if this is a healable streaming error
      let healingResult = null;
      if (isHealableStreamError(error)) {
        // Get available tools from agent if possible
        const availableTools = (agent as { tools?: ToolSet }).tools || {};
        healingResult = healStreamingToolError(error, availableTools);
      }

      if ((!retryableError && !healingResult) || retryCount >= retryConfig.maxRetries) {
        // Not retryable or max retries reached
        throw error;
      }

      // Call retry callback if provided
      if (retryConfig.onRetry) {
        retryConfig.onRetry(
          {
            type:
              (healingResult?.healed ? 'invalid-tool-arguments' : retryableError?.type) ||
              'empty-response',
            originalError: error,
            healingMessage: healingResult?.healingMessage ||
              retryableError?.healingMessage || { role: 'user', content: 'Error occurred' },
          },
          retryCount + 1
        );
      }

      // Add healing message to conversation history
      const messageToAdd = healingResult?.healingMessage || retryableError?.healingMessage;
      if (messageToAdd) {
        conversationHistory = [...conversationHistory, messageToAdd];
      }

      // Increment retry count
      retryCount++;

      // Apply exponential backoff if enabled
      if (retryConfig.exponentialBackoff && retryCount <= retryConfig.maxRetries) {
        const delay = calculateBackoffDelay(retryCount, retryConfig.maxBackoffMs);
        // Retrying with healing after exponential backoff
        await sleep(delay);
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry loop exited unexpectedly');
}
