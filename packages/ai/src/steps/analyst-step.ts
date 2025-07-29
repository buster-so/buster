import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

import { getPermissionedDatasets } from '@buster/access-controls';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { createAnalystInstructionsWithoutDatasets } from '../agents/analyst-agent/analyst-agent-instructions';
import { getSqlDialectGuidance } from '../agents/shared/sql-dialect-guidance';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import {
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
import {
  createRetryOnErrorHandler,
  createUserFriendlyErrorMessage,
  handleRetryWithHealing,
  isRetryWithHealingError,
} from '../utils/retry';
import type { RetryableError, WorkflowContext } from '../utils/retry/types';
import { createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = ThinkAndPrepOutputSchema;

// Analyst-specific metadata schema
const AnalystMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  doneTool: z.boolean().optional(),
  filesCreated: z.number().optional(),
  filesReturned: z.number().optional(),
});

const outputSchema = z.object({
  conversationHistory: MessageHistorySchema, // Properly typed message history
  finished: z.boolean().optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: AnalystMetadataSchema.optional(),
  selectedFile: z
    .object({
      fileId: z.string().uuid().optional(),
      fileType: z.string().optional(),
      versionNumber: z.number().optional(),
    })
    .optional(),
  finalReasoningMessage: z.string().optional(),
});

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

/**
 * Transform reasoning/response history to match ChunkProcessor expected types
 */
function transformHistoryForChunkProcessor(
  reasoningHistory: z.infer<typeof ReasoningHistorySchema> | undefined,
  responseHistory: z.infer<typeof ResponseHistorySchema>
): {
  reasoningHistory: ChatMessageReasoningMessage[];
  responseHistory: ChatMessageResponseMessage[];
} {
  const validPillTypes = [
    'value',
    'metric',
    'dashboard',
    'collection',
    'dataset',
    'term',
    'topic',
    'empty',
  ] as const;

  const safeReasoningHistory = reasoningHistory || [];

  const transformedReasoning = safeReasoningHistory.map((entry) => {
    if (entry.type === 'pills') {
      return {
        ...entry,
        pill_containers: entry.pill_containers.map((container) => ({
          ...container,
          pills: container.pills.map((pill) => ({
            ...pill,
            type: validPillTypes.includes(pill.type as (typeof validPillTypes)[number])
              ? pill.type
              : 'empty',
          })),
        })),
      };
    }
    return entry;
  }) as ChatMessageReasoningMessage[];

  return {
    reasoningHistory: transformedReasoning,
    responseHistory: responseHistory as ChatMessageResponseMessage[],
  };
}

/**
 * Create a unique key for a message to detect duplicates
 * Optimized to avoid expensive JSON.stringify operations
 */
function createMessageKey(msg: CoreMessage): string {
  if (msg.role === 'assistant' && Array.isArray(msg.content)) {
    // For assistant messages with tool calls, use toolCallId as part of the key
    const toolCallIds = msg.content
      .filter(
        (c): c is { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown } =>
          typeof c === 'object' &&
          c !== null &&
          'type' in c &&
          c.type === 'tool-call' &&
          'toolCallId' in c &&
          'toolName' in c &&
          'args' in c
      )
      .map((c) => c.toolCallId)
      .filter((id): id is string => id !== undefined)
      .sort()
      .join(',');
    if (toolCallIds) {
      return `assistant:tools:${toolCallIds}`;
    }

    // For text content, use first 100 chars as key
    const textContent = msg.content.find(
      (c): c is { type: 'text'; text: string } =>
        typeof c === 'object' && c !== null && 'type' in c && c.type === 'text' && 'text' in c
    );
    if (textContent?.text) {
      return `assistant:text:${textContent.text.substring(0, 100)}`;
    }
  }

  if (msg.role === 'tool' && Array.isArray(msg.content)) {
    // For tool messages, use tool result IDs
    const toolResultIds = msg.content
      .filter(
        (c): c is { type: 'tool-result'; toolCallId: string; toolName: string; result: unknown } =>
          typeof c === 'object' &&
          c !== null &&
          'type' in c &&
          c.type === 'tool-result' &&
          'toolCallId' in c
      )
      .map((c) => c.toolCallId)
      .filter((id): id is string => id !== undefined)
      .sort()
      .join(',');
    if (toolResultIds) {
      return `tool:results:${toolResultIds}`;
    }
  }

  if (msg.role === 'user') {
    const text =
      typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content) &&
            msg.content[0] &&
            typeof msg.content[0] === 'object' &&
            'text' in msg.content[0]
          ? (msg.content[0] as { text?: string }).text || ''
          : '';

    // Fast hash function for user messages instead of JSON.stringify
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 200); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user:${hash}`;
  }

  // Fallback for other roles
  return `${msg.role}:${Date.now()}`;
}

/**
 * Deduplicate messages based on role and content/toolCallId
 */
function deduplicateMessages(messages: CoreMessage[]): CoreMessage[] {
  const seen = new Set<string>();
  const deduplicated: CoreMessage[] = [];
  let duplicatesFound = 0;

  for (const [index, msg] of Array.from(messages.entries())) {
    const key = createMessageKey(msg);
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(msg);
    } else {
      duplicatesFound++;
      console.warn(`Duplicate message found at index ${index}:`, {
        role: msg.role,
        key,
        content:
          msg.role === 'assistant' && Array.isArray(msg.content)
            ? msg.content.map((c) => {
                if (typeof c === 'object' && c !== null && 'type' in c) {
                  return {
                    type: c.type,
                    toolCallId: 'toolCallId' in c ? c.toolCallId : undefined,
                  };
                }
                return { type: 'unknown' };
              })
            : 'non-assistant message',
      });
    }
  }

  if (duplicatesFound > 0) {
    console.info(
      `Removed ${duplicatesFound} duplicate messages. Original: ${messages.length}, Deduplicated: ${deduplicated.length}`
    );
  }

  return deduplicated;
}

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Check if think-and-prep already finished - if so, pass through
  if (inputData.finished === true) {
    return {
      conversationHistory: inputData.conversationHistory,
      finished: true,
      stepData: inputData.stepData,
      reasoningHistory: inputData.reasoningHistory || [],
      responseHistory: inputData.responseHistory || [],
      metadata: inputData.metadata,
      selectedFile: undefined, // No file selection if think-and-prep finished early
    };
  }

  const abortController = new AbortController();
  const messageId = runtimeContext.get('messageId') as string | null;
  let completeConversationHistory: CoreMessage[] = [];
  let retryCount = 0;
  const maxRetries = 5;

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

  // Initialize chunk processor with histories from previous step
  // IMPORTANT: Pass histories from think-and-prep to accumulate across steps
  const { reasoningHistory: transformedReasoning, responseHistory: transformedResponse } =
    transformHistoryForChunkProcessor(
      inputData.reasoningHistory || [],
      inputData.responseHistory || []
    );

  // Log full input data to debug dashboard context
  console.info('[Analyst Step] Input data keys:', Object.keys(inputData));
  console.info('[Analyst Step] Dashboard context details:', {
    hasDashboardContext: 'dashboardContext' in inputData,
    dashboardContextValue: inputData.dashboardContext,
    inputDataSample: JSON.stringify(inputData).substring(0, 500),
  });

  console.info('[Analyst Step] Creating ChunkProcessor:', {
    messageId,
    reasoningHistoryCount: transformedReasoning.length,
    responseHistoryCount: transformedResponse.length,
    dashboardContextProvided: inputData.dashboardContext !== undefined,
    dashboardContextLength: inputData.dashboardContext?.length || 0,
    dashboardContext: inputData.dashboardContext,
  });

  // Get available tools from the analyst agent
  const availableTools = new Set(Object.keys(analystAgent.tools || {}));
  console.info('[Analyst Step] Available tools:', Array.from(availableTools));

  // Get workflow start time from runtime context
  const workflowStartTime = runtimeContext.get('workflowStartTime');

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    transformedReasoning, // Pass transformed reasoning history
    transformedResponse, // Pass transformed response history
    inputData.dashboardContext, // Pass dashboard context
    availableTools,
    workflowStartTime
  );

  // Messages come directly from think-and-prep step output
  // They are already in CoreMessage[] format
  let messages = inputData.conversationHistory;

  if (messages && messages.length > 0) {
    // Deduplicate messages based on role and toolCallId
    messages = deduplicateMessages(messages);
  }

  // Critical check: Ensure messages array is not empty
  if (!messages || messages.length === 0) {
    console.error('CRITICAL: Empty messages array detected in analyst step', {
      inputData,
      messagesType: typeof messages,
      isArray: Array.isArray(messages),
    });

    throw new Error(
      'Critical error: No valid messages found in analyst step input. conversationHistory is empty.'
    );
  }

  // Set initial messages in chunk processor
  chunkProcessor.setInitialMessages(messages);

  // Main execution loop with retry logic
  while (retryCount <= maxRetries) {
    try {
      console.info('Analyst: Starting stream attempt', {
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
              content: createAnalystInstructionsWithoutDatasets(sqlDialectGuidance),
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
          const stream = await analystAgent.stream(messagesWithSystem, {
            toolCallStreaming: true,
            runtimeContext,
            maxRetries: 5,
            toolChoice: 'required',
            abortSignal: abortController.signal,
            onChunk: createOnChunkHandler({
              chunkProcessor,
              abortController,
              finishingToolNames: ['doneTool'],
            }),
            onError: createRetryOnErrorHandler({
              retryCount,
              maxRetries,
              workflowContext: {
                currentStep: 'analyst',
                availableTools,
              },
            }),
          });

          return stream;
        },
        {
          name: 'Analyst',
          spanAttributes: {
            messageCount: messages.length,
            retryAttempt: retryCount,
            previousStep: {
              toolsUsed: inputData.metadata?.toolsUsed,
              finalTool: inputData.metadata?.finalTool,
              hasReasoning: !!inputData.metadata?.reasoning,
            },
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

      console.info('Analyst: Stream completed successfully');
      break; // Exit the retry loop on success
    } catch (error) {
      console.error('Analyst: Error in stream processing', error);

      // Handle normal AbortError (from doneTool)
      if (error instanceof Error && error.name === 'AbortError') {
        console.info('Analyst: Stream aborted successfully (normal completion)');
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
            currentStep: 'analyst',
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
          console.error('Analyst: Failed to save healing message to database', {
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
        console.error('Analyst: Max retries exhausted', {
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

  // Get final conversation history from chunk processor
  completeConversationHistory = chunkProcessor.getAccumulatedMessages();

  // Get files metadata for the response
  const filesMetadata = {
    filesCreated: chunkProcessor.getTotalFilesCreated(),
    filesReturned: chunkProcessor.getCurrentFileSelection().files.length,
  };

  // Extract selected file information
  const fileSelection = chunkProcessor.getCurrentFileSelection();
  const firstFile = fileSelection.files[0];
  const selectedFile = firstFile
    ? {
        fileId: firstFile.id,
        fileType: firstFile.fileType,
        versionNumber: firstFile.versionNumber,
      }
    : undefined;

  // Get error summary and log if there were any issues
  const errorSummary = chunkProcessor.getErrorSummary();
  if (errorSummary.totalErrors > 0) {
    console.warn('[Analyst Step] Errors accumulated during execution:', {
      totalErrors: errorSummary.totalErrors,
      silentFailures: errorSummary.silentFailures,
      criticalErrors: errorSummary.criticalErrors,
      retryErrors: errorSummary.retryErrors,
    });

    // Send telemetry for monitoring
    await chunkProcessor.getErrorAccumulator().sendTelemetry();
  }

  return {
    conversationHistory: completeConversationHistory,
    finished: true,
    reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
      typeof ReasoningHistorySchema
    >,
    responseHistory: chunkProcessor.getResponseHistory() as z.infer<typeof ResponseHistorySchema>,
    metadata: {
      ...inputData.metadata,
      ...filesMetadata,
    },
    selectedFile,
    finalReasoningMessage: chunkProcessor.getFinalReasoningMessage(),
  };
};

export const analystStep = createStep({
  id: 'analyst',
  description: 'This step runs the analyst agent to analyze data and create metrics or dashboards.',
  inputSchema,
  outputSchema,
  execute: analystExecution,
});
