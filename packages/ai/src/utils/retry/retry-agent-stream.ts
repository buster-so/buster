import type { ToolSet } from 'ai';
import { NoSuchToolError } from 'ai';
import { healStreamingToolError, isHealableStreamError } from '../streaming/tool-healing';
import type { RetryConfig, RetryResult, RetryableAgentStreamParams, RetryableError } from './types';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
};

/**
 * Detects if an error is retryable and creates a healing message
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

  // Handle InvalidToolArgumentsError
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

  // Handle empty response (no tool calls when required)
  if (
    error instanceof Error &&
    (error.message.includes('No tool calls') || error.message.includes('Empty response'))
  ) {
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

      // Increment retry count and continue
      retryCount++;
      // Log retry attempt for debugging
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

      // Increment retry count and continue
      retryCount++;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry loop exited unexpectedly');
}
