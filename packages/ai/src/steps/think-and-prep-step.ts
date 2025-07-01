import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import type { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import { detectRetryableError } from '../utils/retry';
import type { RetryableError } from '../utils/retry/types';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';
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
  dashboardFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        versionNumber: z.number(),
        metricIds: z.array(z.string()),
      })
    )
    .optional(),
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
  responseHistory: BusterChatMessageResponse[] = [],
  dashboardContext?: Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }>
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
  dashboardContext,
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
  let retryCount = 0;
  const maxRetries = 3;

  // Extract reasoning history from create-todos step
  const rawReasoningHistory = inputData['create-todos'].reasoningHistory || [];

  // Use reasoning history directly without unnecessary property reordering
  const initialReasoningHistory = rawReasoningHistory as ChatMessageReasoningMessage[];

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
    let messages: CoreMessage[] = [...baseMessages, todoCallMessage];

    // Inject stored values search results if available
    const storedValuesResults = inputData['extract-values-search'].searchResults;
    if (storedValuesResults && inputData['extract-values-search'].searchPerformed) {
      const storedValuesMessage = createStoredValuesToolCallMessage(storedValuesResults);
      messages.push(storedValuesMessage);
    }

    // Update chunk processor with initial messages
    chunkProcessor.setInitialMessages(messages);

    // Main execution loop with retry logic
    while (retryCount <= maxRetries) {
      try {
        const wrappedStream = wrapTraced(
          async () => {
            // Create stream directly without retryableAgentStreamWithHealing
            const stream = await thinkAndPrepAgent.stream(messages, {
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
            });

            return stream;
          },
          {
            name: 'Think and Prep',
            spanAttributes: {
              messageCount: messages.length,
              retryAttempt: retryCount,
            },
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

          // If we get here, the stream completed successfully
          break; // Exit the retry loop
        } catch (streamError) {
          // Handle AbortError gracefully - this is a successful completion
          if (streamError instanceof Error && streamError.name === 'AbortError') {
            break; // Exit the retry loop, this is normal
          }

          // For other streaming errors, check if they're healable
          const healingResult = await handleStreamingError(streamError, {
            agent: thinkAndPrepAgent,
            chunkProcessor,
            runtimeContext,
            abortController,
            resourceId: runtimeContext.get('dataSourceId') as string,
            threadId: runtimeContext.get('chatId') as string,
            maxRetries: maxRetries - retryCount, // Remaining retries
            onRetry: (error: RetryableError, attemptNumber: number) => {
              console.error(
                `Think and Prep stream retry attempt ${
                  retryCount + attemptNumber
                } for streaming error:`,
                error
              );
            },
            toolChoice: 'required',
          });

          if (healingResult.shouldRetry && healingResult.healingMessage) {
            // Add the healing message to conversation history and retry
            messages = [...messages, healingResult.healingMessage];
            chunkProcessor.setInitialMessages(messages);
            retryCount++;
            continue; // Continue to next iteration of retry loop
          }

          // Non-healable error, throw it
          console.error('Non-healable streaming error:', streamError);
          throw streamError;
        }
      } catch (error) {
        console.error('Error in think and prep step:', error);
        // Handle errors during stream creation
        if (error instanceof Error && error.name === 'AbortError') {
          // This is expected when we abort the stream
          break; // Exit the retry loop
        }

        // Check if this is a retryable error (AI SDK errors)
        const retryableError = detectRetryableError(error);
        if (retryableError && retryCount < maxRetries) {
          // Add healing message to conversation history
          messages = [...messages, retryableError.healingMessage];
          chunkProcessor.setInitialMessages(messages);

          console.error(`Think and Prep retry attempt ${retryCount + 1} for error:`, {
            type: retryableError.type,
            attempt: retryCount + 1,
            messageId: runtimeContext.get('messageId'),
            originalError:
              retryableError.originalError instanceof Error
                ? retryableError.originalError.message
                : 'Unknown',
          });

          retryCount++;
          continue; // Continue to next iteration of retry loop
        }

        // Not retryable or max retries exceeded
        console.error('Error in think and prep step:', error);

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
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[],
      inputData.dashboardFiles // Pass dashboard context through
    );

    return result;
  } catch (error) {
    // Only return a result for AbortError (which is expected when tools finish)
    if (error instanceof Error && error.name === 'AbortError') {
      // Get final results from chunk processor
      completeConversationHistory = chunkProcessor.getAccumulatedMessages();
      outputMessages = extractMessageHistory(completeConversationHistory);

      return createStepResult(
        finished,
        outputMessages,
        finalStepData,
        chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
        chunkProcessor.getResponseHistory() as BusterChatMessageResponse[],
        inputData.dashboardFiles // Pass dashboard context through
      );
    }

    // For other errors, re-throw them (they should have been handled in the retry loop)
    throw error;
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
