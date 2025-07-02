import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import type { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import {
  RetryWithHealingError,
  detectRetryableError,
  isRetryWithHealingError,
} from '../utils/retry';
import type { RetryableError, WorkflowContext } from '../utils/retry/types';
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
      | 'messageUserClarifyingQuestion'
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
  const maxRetries = 5;

  // Extract reasoning history from create-todos step
  const rawReasoningHistory = inputData['create-todos'].reasoningHistory || [];

  // Use reasoning history directly without unnecessary property reordering
  const initialReasoningHistory = rawReasoningHistory as ChatMessageReasoningMessage[];

  // Get initial data early to have dashboard context
  const initData = await getInitData();
  const dashboardFiles = (initData.dashboardFiles || []) as Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }>;

  // Initialize chunk processor with initial messages, reasoning history, and dashboard context
  const availableTools = new Set([
    'sequentialThinking',
    'executeSql',
    'respondWithoutAnalysis',
    'submitThoughts',
    'messageUserClarifyingQuestion',
  ]);

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    initialReasoningHistory,
    [],
    dashboardFiles, // Pass dashboard context
    availableTools
  );

  try {
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
              maxRetries: 5,
              abortSignal: abortController.signal,
              toolChoice: 'required',
              onChunk: createOnChunkHandler({
                chunkProcessor,
                abortController,
                finishingToolNames: [
                  'submitThoughts',
                  'respondWithoutAnalysis',
                  'messageUserClarifyingQuestion',
                ],
                onFinishingTool: () => {
                  // Only set finished = true for respondWithoutAnalysis
                  // submitThoughts and messageUserClarifyingQuestion should abort but not finish so workflow can continue
                  const finishingToolName = chunkProcessor.getFinishingToolName();
                  if (finishingToolName === 'respondWithoutAnalysis') {
                    finished = true;
                  }
                },
              }),
              onError: async (event: { error: unknown }) => {
                const error = event.error;
                console.error('Think and Prep stream error caught in onError:', error);

                // Check if this is a retryable error
                const workflowContext: WorkflowContext = {
                  currentStep: 'think-and-prep',
                };
                const retryableError = detectRetryableError(error, workflowContext);
                if (!retryableError || retryCount >= maxRetries) {
                  console.error('Think and Prep onError: Not retryable or max retries reached', {
                    isRetryable: !!retryableError,
                    retryCount,
                    maxRetries,
                    errorType: retryableError?.type || 'unknown',
                  });
                  // Not retryable or max retries reached - let it fail
                  return; // Let the error propagate normally
                }

                console.info('Think and Prep onError: Setting up retry', {
                  retryCount: retryCount + 1,
                  maxRetries,
                  errorType: retryableError.type,
                  healingMessage: retryableError.healingMessage,
                });

                // Throw a special error with the healing info to trigger retry
                throw new RetryWithHealingError(retryableError);
              },
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

        // Process the stream - chunks are handled by onChunk callback
        for await (const _chunk of stream.fullStream) {
          // Stream is being processed via onChunk callback
          // This loop just ensures the stream completes
          if (abortController.signal.aborted) {
            break;
          }
        }

        console.info('Think and Prep: Stream completed successfully');
        break; // Exit the retry loop on success
      } catch (error) {
        console.error('Think and Prep: Error in stream processing', error);

        // Handle our special retry error
        if (isRetryWithHealingError(error)) {
          const retryableError = error.retryableError;

          // Get the current messages from chunk processor to find the failed tool call
          const currentMessages = chunkProcessor.getAccumulatedMessages();
          const healingMessage = retryableError.healingMessage;
          let insertionIndex = currentMessages.length; // Default to end

          // If this is a NoSuchToolError, find the correct position to insert the healing message
          if (retryableError.type === 'no-such-tool' && Array.isArray(healingMessage.content)) {
            const firstContent = healingMessage.content[0];
            if (
              firstContent &&
              typeof firstContent === 'object' &&
              'type' in firstContent &&
              firstContent.type === 'tool-result' &&
              'toolCallId' in firstContent &&
              'toolName' in firstContent
            ) {
              // Find the assistant message with the failed tool call
              for (let i = currentMessages.length - 1; i >= 0; i--) {
                const msg = currentMessages[i];
                if (msg && msg.role === 'assistant' && Array.isArray(msg.content)) {
                  // Find tool calls in this message
                  const toolCalls = msg.content.filter(
                    (
                      c
                    ): c is {
                      type: 'tool-call';
                      toolCallId: string;
                      toolName: string;
                      args: unknown;
                    } =>
                      typeof c === 'object' &&
                      c !== null &&
                      'type' in c &&
                      c.type === 'tool-call' &&
                      'toolCallId' in c &&
                      'toolName' in c &&
                      'args' in c
                  );

                  // Check each tool call to see if it matches and has no result
                  for (const toolCall of toolCalls) {
                    // Check if this tool call matches the failed tool name
                    if (toolCall.toolName === firstContent.toolName) {
                      // Look ahead for tool results
                      let hasResult = false;
                      for (let j = i + 1; j < currentMessages.length; j++) {
                        const nextMsg = currentMessages[j];
                        if (nextMsg && nextMsg.role === 'tool' && Array.isArray(nextMsg.content)) {
                          const hasMatchingResult = nextMsg.content.some(
                            (c) =>
                              typeof c === 'object' &&
                              c !== null &&
                              'type' in c &&
                              c.type === 'tool-result' &&
                              'toolCallId' in c &&
                              c.toolCallId === toolCall.toolCallId
                          );
                          if (hasMatchingResult) {
                            hasResult = true;
                            break;
                          }
                        }
                      }

                      // If this tool call has no result, this is our failed call
                      if (!hasResult) {
                        console.info(
                          'Think and Prep: Found orphaned tool call, using its ID for healing',
                          {
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            atIndex: i,
                          }
                        );

                        // Update the healing message with the correct toolCallId
                        firstContent.toolCallId = toolCall.toolCallId;

                        // Insert position is right after this assistant message
                        insertionIndex = i + 1;
                        break;
                      }
                    }
                  }

                  // If we found the position, stop searching
                  if (insertionIndex !== currentMessages.length) break;
                }
              }
            }
          }

          console.info('Think and Prep: Retrying with healing message', {
            retryCount,
            errorType: retryableError.type,
            insertionIndex,
            totalMessages: currentMessages.length,
          });

          // Create new messages array with healing message inserted at the correct position
          const updatedMessages = [
            ...currentMessages.slice(0, insertionIndex),
            healingMessage,
            ...currentMessages.slice(insertionIndex),
          ];

          // Update messages for the retry
          messages = updatedMessages;

          // Reset chunk processor with the properly ordered messages
          chunkProcessor.setInitialMessages(messages);

          // Force save to persist the healing message immediately
          await chunkProcessor.saveToDatabase();

          retryCount++;

          // Continue to next retry iteration
          continue;
        }

        // Handle normal AbortError (from submitThoughts, etc)
        if (error instanceof Error && error.name === 'AbortError') {
          console.info('Think and Prep: Stream aborted successfully (normal completion)');
          break; // Normal abort, exit retry loop
        }

        // Any other error at this point is fatal
        console.error('Think and Prep: Fatal error - not retryable', {
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
        });

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
    console.info('[Think and Prep Step] Creating result:', {
      finished,
      outputMessagesCount: outputMessages.length,
      reasoningHistoryCount: chunkProcessor.getReasoningHistory().length,
      responseHistoryCount: chunkProcessor.getResponseHistory().length,
      dashboardFilesProvided: dashboardFiles !== undefined,
      dashboardFilesCount: dashboardFiles?.length || 0,
      dashboardFiles: dashboardFiles,
    });

    const result = createStepResult(
      finished,
      outputMessages,
      finalStepData,
      chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[],
      dashboardFiles // Pass dashboard context through
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
        dashboardFiles // Pass dashboard context through
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
