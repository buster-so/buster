import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import { retryableAgentStreamWithHealing } from '../utils/retry';
import type { RetryableError } from '../utils/retry/types';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';
import { createTodosOutputSchema } from './create-todos-step';
import { extractValuesSearchOutputSchema } from './extract-values-search-step';
import { generateChatTitleOutputSchema } from './generate-chat-title-step';

const inputSchema = z.object({
  'create-todos': createTodosOutputSchema,
  'extract-values-search': extractValuesSearchOutputSchema,
  'generate-chat-title': generateChatTitleOutputSchema,
});

import {
  extractMessageHistory,
  getAllToolsUsed,
  getLastToolUsed,
} from '../utils/memory/message-history';
import { createStoredValuesToolCallMessage } from '../utils/memory/stored-values-to-messages';
import { createTodoToolCallMessage } from '../utils/memory/todos-to-messages';
import {
  type BusterChatMessageReasoningSchema,
  type BusterChatMessageResponseSchema,
  type MessageHistory,
  type StepFinishData,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';

type BusterChatMessageReasoning = z.infer<typeof BusterChatMessageReasoningSchema>;
type BusterChatMessageResponse = z.infer<typeof BusterChatMessageResponseSchema>;

const outputSchema = ThinkAndPrepOutputSchema;

// Helper function to create the result object
const createStepResult = (
  finished: boolean,
  outputMessages: MessageHistory,
  finalStepData: StepFinishData | null,
  reasoningHistory: BusterChatMessageReasoning[] = [],
  responseHistory: BusterChatMessageResponse[] = []
): z.infer<typeof outputSchema> => ({
  finished,
  outputMessages,
  conversationHistory: outputMessages,
  stepData: finalStepData || undefined,
  reasoningHistory,
  responseHistory,
  metadata: {
    toolsUsed: getAllToolsUsed(outputMessages),
    finalTool: getLastToolUsed(outputMessages) as
      | 'submitThoughts'
      | 'respondWithoutAnalysis'
      | undefined,
    text: undefined,
    reasoning: undefined,
  },
});

const thinkAndPrepExecution = async ({
  inputData,
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const abortController = new AbortController();
  const messageId = runtimeContext.get('messageId') as string | null;

  let outputMessages: MessageHistory = [];
  let finished = false;
  const finalStepData: StepFinishData | null = null;

  // Extract reasoning history from create-todos step
  const initialReasoningHistory = inputData['create-todos'].reasoningHistory || [];

  // Initialize chunk processor with initial messages and reasoning history
  const chunkProcessor = new ChunkProcessor(messageId, [], initialReasoningHistory, []);

  try {
    const initData = await getInitData();
    const todos = inputData['create-todos'].todos;

    // Standardize messages from workflow inputs
    const inputPrompt = initData.prompt;
    const conversationHistory = initData.conversationHistory || [];

    // Create base messages from prompt
    let baseMessages: CoreMessage[];
    if (conversationHistory.length > 0) {
      // If we have conversation history, append the new prompt to it
      baseMessages = appendToConversation(conversationHistory, inputPrompt);
    } else {
      // Otherwise, just use the prompt as a new conversation
      baseMessages = standardizeMessages(inputPrompt);
    }

    // Create todo messages and inject them into the conversation history
    const todoCallMessage = createTodoToolCallMessage(todos);
    const messages = [...baseMessages, todoCallMessage];

    // Inject stored values search results if available
    const storedValuesResults = inputData['extract-values-search'].searchResults;
    if (storedValuesResults && inputData['extract-values-search'].searchPerformed) {
      const storedValuesMessage = createStoredValuesToolCallMessage(storedValuesResults);
      messages.push(storedValuesMessage);
    }

    // Update chunk processor with initial messages
    chunkProcessor.setInitialMessages(messages);

    // Note: Todo reasoning message is handled by the UI layer directly from the tool call message

    const wrappedStream = wrapTraced(
      async () => {
        const result = await retryableAgentStreamWithHealing({
          agent: thinkAndPrepAgent,
          messages,
          options: {
            toolCallStreaming: true,
            runtimeContext,
            abortSignal: abortController.signal,
            toolChoice: 'required',
            onChunk: createOnChunkHandler({
              chunkProcessor,
              abortController,
              finishingToolNames: ['submitThoughts', 'respondWithoutAnalysis'],
              onFinishingTool: () => {
                // Only set finished = true for respondWithoutAnalysis
                // submitThoughts should abort but not finish so workflow can continue
                const finishingToolName = chunkProcessor.getFinishingToolName();
                if (finishingToolName === 'respondWithoutAnalysis') {
                  finished = true;
                }
              },
            }),
          },
          retryConfig: {
            maxRetries: 3,
            onRetry: (error: RetryableError, attemptNumber: number) => {
              // Log retry attempt for debugging
              console.error(`Think and Prep retry attempt ${attemptNumber} for error:`, error);
            },
          },
        });

        // Update messages to include any healing messages added during retries
        if (Array.isArray(messages) && Array.isArray(result.conversationHistory)) {
          messages.length = 0;
          messages.push(...result.conversationHistory);
        } else {
          console.error('Invalid messages or conversationHistory array');
        }

        return result.stream;
      },
      {
        name: 'Think and Prep',
      }
    );

    const stream = await wrappedStream();

    try {
      // Process the stream - chunks are handled by onChunk callback
      for await (const _chunk of stream.fullStream) {
        // Stream is being processed via onChunk callback
        // This loop just ensures the stream completes
        if (abortController.signal.aborted) {
          break;
        }
      }
    } catch (streamError) {
      // Handle AbortError gracefully
      if (streamError instanceof Error && streamError.name === 'AbortError') {
        // Stream was intentionally aborted, this is normal
      } else {
        // Check if this is a healable streaming error
        const healingResult = await handleStreamingError(streamError, {
          agent: thinkAndPrepAgent,
          chunkProcessor,
          runtimeContext,
          abortController,
          maxRetries: 3,
          onRetry: (error: RetryableError, attemptNumber: number) => {
            console.error(
              `Think and Prep stream retry attempt ${attemptNumber} for streaming error:`,
              error
            );
          },
          toolChoice: 'required',
        });

        if (healingResult.shouldRetry && healingResult.healingMessage) {
          // Healing was successful but we still need to fail this step
          // since we can't restart the stream processing in the current implementation
          throw new Error(
            `Stream processing failed and requires retry: ${
              streamError instanceof Error ? streamError.message : 'Unknown streaming error'
            }`
          );
        }
        console.error('Error processing stream:', streamError);
        throw streamError; // Re-throw non-healable errors
      }
    }

    // Get final results from chunk processor
    outputMessages = extractMessageHistory(chunkProcessor.getAccumulatedMessages());

    // DEBUG: Log what we're passing to analyst step
    const result = createStepResult(
      finished,
      outputMessages,
      finalStepData,
      chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[]
    );

    return result;
  } catch (error) {
    // Only return a result for AbortError (which is expected when tools finish)
    if (error instanceof Error && error.name === 'AbortError') {
      return createStepResult(
        finished,
        outputMessages,
        finalStepData,
        chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
        chunkProcessor.getResponseHistory() as BusterChatMessageResponse[]
      );
    }

    // For all other errors, throw to stop the workflow
    throw new Error(
      `Error in think and prep step: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const thinkAndPrepStep = createStep({
  id: 'think-and-prep',
  description:
    'This step runs the think and prep agent to analyze the prompt and prepare thoughts.',
  inputSchema,
  outputSchema,
  execute: thinkAndPrepExecution,
});
