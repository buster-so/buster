import { getPermissionedDatasets } from '@buster/access-controls';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { getSqlDialectGuidance } from '../agents/shared/sql-dialect-guidance';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { createThinkAndPrepInstructionsWithoutDatasets } from '../agents/think-and-prep-agent/think-and-prep-instructions';
import type { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import {
  createRetryOnErrorHandler,
  createUserFriendlyErrorMessage,
  handleRetryWithHealing,
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

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

// Helper function to create the result object
const createStepResult = (
  finished: boolean,
  conversationHistory: MessageHistory,
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
  conversationHistory,
  stepData: finalStepData || undefined,
  reasoningHistory,
  responseHistory,
  metadata: {
    toolsUsed: getAllToolsUsed(conversationHistory),
    finalTool: getLastToolUsed(conversationHistory) as
      | 'submitThoughts'
      | 'respondWithoutAssetCreation'
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

  let conversationHistory: MessageHistory = [];
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
    'respondWithoutAssetCreation',
    'submitThoughts',
    'messageUserClarifyingQuestion',
  ]);

  // Get workflow start time from runtime context
  const workflowStartTime = runtimeContext.get('workflowStartTime');

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    initialReasoningHistory,
    [],
    dashboardFiles, // Pass dashboard context
    availableTools,
    workflowStartTime
  );

  try {
    // Get database context and SQL dialect guidance
    const userId = runtimeContext.get('userId');
    const dataSourceSyntax = runtimeContext.get('dataSourceSyntax');

    const datasetResults = await getPermissionedDatasets({ userId, page: 0, pageSize: 1000 });

    // Extract yml_content from each dataset and join with separators
    const assembledYmlContent = datasetResults.datasets
      .map((dataset: { ymlContent: string | null | undefined }) => dataset.ymlContent)
      .filter((content: string | null | undefined) => content !== null && content !== undefined)
      .join('\n---\n');

    // Get dialect-specific guidance
    const sqlDialectGuidance = getSqlDialectGuidance(dataSourceSyntax);

    // Create dataset system message
    const createDatasetSystemMessage = (databaseContext: string): string => {
      return `<database_context>
${databaseContext}
</database_context>`;
    };
    const todos = inputData['create-todos'].todos;

    // Standardize messages from workflow inputs
    const inputPrompt = initData.prompt;
    const inputConversationHistory = initData.conversationHistory || [];

    // Create base messages from prompt
    let baseMessages: CoreMessage[];
    if (inputConversationHistory.length > 0) {
      // If we have conversation history, append the new prompt to it
      baseMessages = appendToConversation(inputConversationHistory, inputPrompt);
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

    console.info('Think and Prep: Initial messages setup', {
      baseMessagesCount: baseMessages.length,
      hasTodos: !!todoCallMessage,
      hasStoredValues: !!(
        storedValuesResults && inputData['extract-values-search'].searchPerformed
      ),
      totalMessagesCount: messages.length,
      messageRoles: messages.map((m) => m.role),
      lastMessage: messages[messages.length - 1],
    });

    // Update chunk processor with initial messages
    chunkProcessor.setInitialMessages(messages);

    // Main execution loop with retry logic
    while (retryCount <= maxRetries) {
      try {
        console.info('Think and Prep: Starting stream attempt', {
          retryCount,
          messagesCount: messages.length,
          messageRoles: messages.map((m) => m.role),
          hasHealingMessage: messages.some(
            (m) =>
              m.role === 'user' &&
              typeof m.content === 'string' &&
              m.content.includes('I encountered an error')
          ),
          hasToolResultHealing: messages.some(
            (m) =>
              m.role === 'tool' &&
              Array.isArray(m.content) &&
              m.content.some(
                (c) =>
                  typeof c === 'object' &&
                  'type' in c &&
                  c.type === 'tool-result' &&
                  'result' in c &&
                  c.result !== null &&
                  typeof c.result === 'object' &&
                  'error' in c.result
              )
          ),
        });

        const wrappedStream = wrapTraced(
          async () => {
            // Create system messages with dataset context and instructions
            const systemMessages: CoreMessage[] = [
              {
                role: 'system',
                content: createThinkAndPrepInstructionsWithoutDatasets(sqlDialectGuidance),
                providerOptions: DEFAULT_CACHE_OPTIONS,
              },
              {
                role: 'system',
                content: createDatasetSystemMessage(assembledYmlContent),
                providerOptions: DEFAULT_CACHE_OPTIONS,
              },
            ];

            // Combine system messages with conversation messages
            const messagesWithSystem = [...systemMessages, ...messages];

            // Create stream directly without retryableAgentStreamWithHealing
            const stream = await thinkAndPrepAgent.stream(messagesWithSystem, {
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
                  'respondWithoutAssetCreation',
                  'messageUserClarifyingQuestion',
                ],
                onFinishingTool: () => {
                  // Set finished = true for respondWithoutAssetCreation and messageUserClarifyingQuestion
                  // submitThoughts should abort but not finish so workflow can continue
                  const finishingToolName = chunkProcessor.getFinishingToolName();
                  if (
                    finishingToolName === 'respondWithoutAssetCreation' ||
                    finishingToolName === 'messageUserClarifyingQuestion'
                  ) {
                    finished = true;
                  }
                },
              }),
              onError: createRetryOnErrorHandler({
                retryCount,
                maxRetries,
                workflowContext: {
                  currentStep: 'think-and-prep',
                  availableTools,
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

        // Handle normal AbortError (from submitThoughts, etc)
        if (error instanceof Error && error.name === 'AbortError') {
          console.info('Think and Prep: Stream aborted successfully (normal completion)');
          break; // Normal abort, exit retry loop
        }

        // Handle our retry error with healing (all errors now have healing)
        if (isRetryWithHealingError(error)) {
          const retryableError = error.retryableError;

          // Get the current messages from chunk processor
          const currentMessages = chunkProcessor.getAccumulatedMessages();

          // Handle the retry with healing
          const { healedMessages, shouldContinueWithoutHealing, backoffDelay } =
            await handleRetryWithHealing(retryableError, currentMessages, retryCount, {
              currentStep: 'think-and-prep',
              availableTools,
            });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));

          // If it's a network error, just increment and continue
          if (shouldContinueWithoutHealing) {
            retryCount++;
            continue;
          }

          // Update messages for the retry (without system messages)
          messages = healedMessages;

          // Update chunk processor with the healed messages
          chunkProcessor.setInitialMessages(healedMessages);

          // Force save to persist the healing message immediately
          try {
            await chunkProcessor.saveToDatabase();
          } catch (dbError) {
            console.error('Think and Prep: Failed to save healing message to database', {
              error: dbError,
              retryCount,
              willContinueAnyway: true,
            });
            // Continue with retry even if save fails
          }

          retryCount++;

          // Continue to next retry iteration
          continue;
        }

        // If we've exhausted retries or it's an unexpected error at this point
        if (retryCount >= maxRetries) {
          console.error('Think and Prep: Max retries exhausted', {
            retryCount,
            maxRetries,
            errorName: error instanceof Error ? error.name : 'unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }

        // Throw user-friendly error message
        throw new Error(createUserFriendlyErrorMessage(error));
      }
    }

    // Get final results from chunk processor
    completeConversationHistory = chunkProcessor.getAccumulatedMessages();
    conversationHistory = extractMessageHistory(completeConversationHistory);

    // DEBUG: Log what we're passing to analyst step
    console.info('[Think and Prep Step] Creating result:', {
      finished,
      conversationHistoryCount: conversationHistory.length,
      reasoningHistoryCount: chunkProcessor.getReasoningHistory().length,
      responseHistoryCount: chunkProcessor.getResponseHistory().length,
      dashboardFilesProvided: dashboardFiles !== undefined,
      dashboardFilesCount: dashboardFiles?.length || 0,
      dashboardFiles: dashboardFiles,
    });

    const result = createStepResult(
      finished,
      conversationHistory,
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
      conversationHistory = extractMessageHistory(completeConversationHistory);

      return createStepResult(
        finished,
        conversationHistory,
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
