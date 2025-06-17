import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { ChatMessageReasoningMessage } from '../../../../server/src/types/chat-types/chat-message.type';
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
  // Include original workflow inputs to maintain access to prompt and conversationHistory
  prompt: z.string(),
  conversationHistory: z.array(z.any()).optional(),
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
  let completeConversationHistory: MessageHistory = [];
  let finished = false;
  const finalStepData: StepFinishData | null = null;

  // Extract reasoning history from create-todos step
  const rawReasoningHistory = inputData['create-todos'].reasoningHistory || [];

  // Transform reasoning history to match server schema property order
  const initialReasoningHistory = rawReasoningHistory.map((entry: ChatMessageReasoningMessage) => {
    if (entry.type === 'text') {
      return {
        status: entry.status,
        id: entry.id,
        type: entry.type,
        title: entry.title,
        message: entry.message,
        secondary_title: entry.secondary_title,
        message_chunk: entry.message_chunk,
        finished_reasoning: entry.finished_reasoning,
      };
    }
    return entry;
  });

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
              console.error(`Think and Prep retry attempt ${attemptNumber} for error:`, {
                type: error.type,
                attempt: attemptNumber,
                messageId: runtimeContext.get('messageId'),
                originalError:
                  error.originalError instanceof Error ? error.originalError.message : 'Unknown',
              });
            },
          },
        });

        // Update messages to include any healing messages added during retries
        if (Array.isArray(messages) && Array.isArray(result.conversationHistory)) {
          messages.length = 0;
          messages.push(...result.conversationHistory);
          // Update complete conversation history with healing messages
          completeConversationHistory = result.conversationHistory;
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
          // Add the healing message to the final conversation history
          // Continue processing rather than failing the step for better resilience
          completeConversationHistory.push(healingResult.healingMessage);
        } else {
          console.error('Error processing stream:', streamError);
          throw streamError; // Re-throw non-healable errors
        }
      }
    }

    // Get final results from chunk processor
    completeConversationHistory = chunkProcessor.getAccumulatedMessages();
    outputMessages = extractMessageHistory(completeConversationHistory);

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

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // Check if it's an API/model error
    if (
      error instanceof Error &&
      (error.message.includes('API') || error.message.includes('model'))
    ) {
      throw new Error(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );
    }

    // For unexpected errors, provide a generic friendly message
    throw new Error(
      'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
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
