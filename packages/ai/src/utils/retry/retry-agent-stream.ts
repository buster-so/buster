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
import { ZodError } from 'zod';
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

  // Also check for errors with APICallError name pattern but not instance
  if (error instanceof Error && error.name === 'APICallError') {
    const statusCode = 'statusCode' in error ? (error as APICallError).statusCode : undefined;
    if (statusCode === 503) {
      return {
        type: 'server-error',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: 'Server temporarily unavailable, retrying...',
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

  // Handle generic "No tool calls generated" error
  if (error instanceof Error && error.message === 'No tool calls generated') {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
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
 * Enhanced version of retryableAgentStream that includes in-place tool healing support
 * Uses the AI SDK's onError callback to heal tool errors without restarting
 */
export async function retryableAgentStreamWithHealing<T extends ToolSet>({
  agent,
  messages,
  options,
  retryConfig = DEFAULT_RETRY_CONFIG,
}: RetryableAgentStreamParams<T>): Promise<RetryResult<T>> {
  let conversationHistory = [...messages];
  let healingAttempts = 0;
  let streamCreationRetries = 0;

  // Check for context compression
  if (shouldCompressHistory(conversationHistory)) {
    conversationHistory = compressConversationHistory(conversationHistory);
  }

  // Retry loop for stream creation errors (network issues, etc.)
  while (streamCreationRetries <= retryConfig.maxRetries) {
    try {
      // Create enhanced options with healing onError callback
      const enhancedOptions = {
        ...options,
        onError: (error: unknown) => {
          // Check for NoSuchToolError
          if (NoSuchToolError.isInstance(error) && healingAttempts < retryConfig.maxRetries) {
            healingAttempts++;

            // Log the healing attempt
            if (retryConfig.onRetry) {
              retryConfig.onRetry(
                {
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
                          error: `Tool "${error.toolName}" is not available. Available tools: ${error.availableTools?.join(', ') || 'none'}. Please use one of the available tools instead.`,
                        },
                      },
                    ],
                  },
                },
                healingAttempts
              );
            }

            // Return error object that will be injected as tool result
            return {
              error: `Tool "${error.toolName}" is not available. Available tools: ${error.availableTools?.join(', ') || 'none'}. Please use one of the available tools instead.`,
            };
          }

          // Check for InvalidToolArgumentsError
          if (
            error instanceof Error &&
            error.name === 'AI_InvalidToolArgumentsError' &&
            healingAttempts < retryConfig.maxRetries
          ) {
            healingAttempts++;

            // Extract Zod error details if available
            let errorDetails = 'Invalid arguments provided';
            if (
              'cause' in error &&
              error.cause &&
              typeof error.cause === 'object' &&
              'errors' in error.cause
            ) {
              const zodError = error.cause as {
                errors: Array<{ path: Array<string | number>; message: string }>;
              };
              errorDetails = zodError.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', ');
            }

            // Log the healing attempt
            if (retryConfig.onRetry) {
              retryConfig.onRetry(
                {
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
                          error: `Invalid tool arguments: ${errorDetails}. Please check the required parameters and try again.`,
                        },
                      },
                    ],
                  },
                },
                healingAttempts
              );
            }

            // Return error object that will be injected as tool result
            return {
              error: `Invalid tool arguments: ${errorDetails}. Please check the required parameters and try again.`,
            };
          }

          // Check for ToolExecutionError
          if (ToolExecutionError.isInstance(error) && healingAttempts < retryConfig.maxRetries) {
            healingAttempts++;

            // Log the healing attempt
            if (retryConfig.onRetry) {
              retryConfig.onRetry(
                {
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
                            'Tool execution failed. Please check your parameters and try again.',
                        },
                      },
                    ],
                  },
                },
                healingAttempts
              );
            }

            // Return error object that will be injected as tool result
            return {
              error: 'Tool execution failed. Please check your parameters and try again.',
            };
          }

          // For non-healable errors, return undefined to let them propagate
          return undefined;
        },
      };

      const stream = await agent.stream(conversationHistory, enhancedOptions as typeof options);

      // Return successful result
      return {
        stream,
        conversationHistory,
        retryCount: streamCreationRetries, // Return stream creation retries, not healing attempts
      };
    } catch (error) {
      // This catch block handles stream creation errors (not tool execution errors)
      const retryableError = detectRetryableError(error);

      if (!retryableError || streamCreationRetries >= retryConfig.maxRetries) {
        // Not retryable or max retries reached
        throw error;
      }

      // Call retry callback if provided
      if (retryConfig.onRetry) {
        retryConfig.onRetry(retryableError, streamCreationRetries + 1);
      }

      // Add healing message to conversation history for stream creation errors
      conversationHistory = [...conversationHistory, retryableError.healingMessage];

      // Increment retry count
      streamCreationRetries++;

      // Apply exponential backoff if enabled
      if (retryConfig.exponentialBackoff) {
        const delay = calculateBackoffDelay(streamCreationRetries, retryConfig.maxBackoffMs);
        await sleep(delay);
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Max stream creation retries reached');
}
