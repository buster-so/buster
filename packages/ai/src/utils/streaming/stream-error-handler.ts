import type { Agent } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, ToolSet } from 'ai';
import type { ChunkProcessor } from '../database/chunk-processor';
import { healStreamingToolError, isHealableStreamError } from './tool-healing';

export interface StreamErrorHandlerConfig {
  agent: Agent<string, Record<string, any>, Record<string, any>>;
  chunkProcessor: ChunkProcessor;
  runtimeContext: RuntimeContext<unknown>;
  abortController: AbortController;
  maxRetries?: number;
  onRetry?: (error: unknown, attemptNumber: number) => void;
  toolChoice?: 'auto' | 'required' | 'none';
  onChunk?: (event: { chunk: any }) => Promise<void> | void;
}

export interface StreamProcessingResult {
  completed: boolean;
  retryCount: number;
  finalMessages: CoreMessage[];
}

/**
 * Handles streaming errors with healing and retry logic
 * This is designed to be called from the stream processing catch blocks in steps
 */
export async function handleStreamingError<T extends ToolSet>(
  error: unknown,
  config: StreamErrorHandlerConfig<T>
): Promise<{ shouldRetry: boolean; healingMessage?: CoreMessage }> {
  const { agent } = config;

  // Check if this is a healable streaming error
  if (!isHealableStreamError(error)) {
    return { shouldRetry: false };
  }

  // Get available tools from agent
  const availableTools = (agent as any).tools || {};

  // Attempt to heal the error
  const healingResult = healStreamingToolError(error, availableTools);

  if (!healingResult) {
    return { shouldRetry: false };
  }

  return {
    shouldRetry: true,
    healingMessage: healingResult.healingMessage,
  };
}

/**
 * Processes a stream with onChunk handler and automatic error healing/retry
 * This replaces the manual try-catch loop in the steps
 */
export async function processStreamWithHealing<T extends ToolSet>(
  stream: any, // The already-created stream from retryableAgentStreamWithHealing
  config: StreamErrorHandlerConfig<T>
): Promise<StreamProcessingResult> {
  const {
    agent,
    chunkProcessor,
    runtimeContext,
    abortController,
    maxRetries = 3,
    onRetry,
    toolChoice = 'required',
  } = config;

  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      // Process the stream chunks - the onChunk handler will process them
      for await (const _chunk of stream.fullStream) {
        if (abortController.signal.aborted) {
          break;
        }
      }

      // If we get here, stream completed successfully
      return {
        completed: true,
        retryCount,
        finalMessages: chunkProcessor.getAccumulatedMessages(),
      };
    } catch (streamError) {
      // Handle AbortError gracefully (this is normal)
      if (streamError instanceof Error && streamError.name === 'AbortError') {
        return {
          completed: true,
          retryCount,
          finalMessages: chunkProcessor.getAccumulatedMessages(),
        };
      }

      // Attempt to heal the streaming error
      const healingResult = await handleStreamingError(streamError, config);

      if (!healingResult.shouldRetry || retryCount >= maxRetries) {
        // Not healable or max retries reached, re-throw
        console.error('Stream error could not be healed:', streamError);
        throw streamError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(streamError, retryCount + 1);
      }

      // Add healing message to conversation history
      if (healingResult.healingMessage) {
        // Get current messages and add healing message
        const currentMessages = chunkProcessor.getAccumulatedMessages();
        const healedMessages = [...currentMessages, healingResult.healingMessage];

        // Update the chunk processor with healing message
        chunkProcessor.setInitialMessages(healedMessages);

        // Create a new stream with healed messages
        const newStream = await agent.stream(healedMessages, {
          runtimeContext,
          abortSignal: abortController.signal,
          toolChoice,
          onChunk: config.onChunk, // Use the same onChunk handler
        });

        // Update stream reference for next iteration
        stream = newStream;
      }

      retryCount++;
      console.log(`Retrying stream after healing error, attempt ${retryCount}/${maxRetries}`);
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw new Error(`Stream processing failed after ${maxRetries} retry attempts`);
}
