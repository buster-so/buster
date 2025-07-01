import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import { hasFailureIndicators, hasFileFailureIndicators } from '../utils/database/types';
import type { ExtractedFile } from '../utils/file-selection';
import { createFileResponseMessages } from '../utils/file-selection';
import {
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
import { retryableAgentStreamWithHealing } from '../utils/retry';
import type { RetryableError } from '../utils/retry/types';
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
  outputMessages: MessageHistorySchema.optional(),
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
});

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

  for (const [index, msg] of messages.entries()) {
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
      conversationHistory: inputData.conversationHistory || inputData.outputMessages,
      finished: true,
      outputMessages: inputData.outputMessages,
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

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    transformedReasoning, // Pass transformed reasoning history
    transformedResponse, // Pass transformed response history
    inputData.dashboardContext // Pass dashboard context
  );

  try {
    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    let messages = inputData.outputMessages;

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

      // Try to use conversationHistory as fallback
      const fallbackMessages = inputData.conversationHistory;
      if (fallbackMessages && Array.isArray(fallbackMessages) && fallbackMessages.length > 0) {
        console.warn('Using conversationHistory as fallback for empty outputMessages');
        messages = deduplicateMessages(fallbackMessages);
      } else {
        throw new Error(
          'Critical error: No valid messages found in analyst step input. Both outputMessages and conversationHistory are empty.'
        );
      }
    }

    // Set initial messages in chunk processor
    chunkProcessor.setInitialMessages(messages);

    const wrappedStream = wrapTraced(
      async () => {
        const result = await retryableAgentStreamWithHealing({
          agent: analystAgent,
          messages,
          options: {
            toolCallStreaming: true,
            runtimeContext,
            toolChoice: 'required',
            abortSignal: abortController.signal,
            onChunk: createOnChunkHandler({
              chunkProcessor,
              abortController,
              finishingToolNames: ['doneTool'],
            }),
          },
          retryConfig: {
            maxRetries: 3,
            onRetry: (error: RetryableError, attemptNumber: number) => {
              // Log retry attempt for debugging
              console.error(`Analyst retry attempt ${attemptNumber} for error:`, {
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
        name: 'Analyst',
        spanAttributes: {
          messageCount: messages.length,
          previousStep: {
            toolsUsed: inputData.metadata?.toolsUsed,
            finalTool: inputData.metadata?.finalTool,
            hasReasoning: !!inputData.metadata?.reasoning,
          },
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
    } catch (streamError) {
      // Handle AbortError gracefully
      if (streamError instanceof Error && streamError.name === 'AbortError') {
        // Stream was intentionally aborted, this is normal
      } else {
        // Check if this is a healable streaming error
        const healingResult = await handleStreamingError(streamError, {
          agent: analystAgent as typeof analystAgent,
          chunkProcessor,
          runtimeContext,
          abortController,
          maxRetries: 3,
          //DALLIN TODO: resourceId AND threadId
          resourceId: runtimeContext.get('dataSourceId') as string,
          threadId: runtimeContext.get('chatId') as string,
          onRetry: (error: RetryableError, attemptNumber: number) => {
            console.error(
              `Analyst stream retry attempt ${attemptNumber} for streaming error:`,
              error
            );
          },
          toolChoice: 'required',
        });

        if (healingResult.shouldRetry && healingResult.healingMessage) {
          // Add the healing message to the final conversation history
          // Note: For now we just log it. A full implementation would need to restart
          // the entire stream processing with the healed conversation.
          completeConversationHistory.push(healingResult.healingMessage);
        } else {
          console.error('Error processing stream:', streamError);
          throw streamError; // Re-throw non-healable errors
        }
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

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
      reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
        typeof ReasoningHistorySchema
      >,
      responseHistory: chunkProcessor.getResponseHistory() as z.infer<typeof ResponseHistorySchema>,
      metadata: {
        ...inputData.metadata,
        ...filesMetadata,
      },
      selectedFile,
    };
  } catch (error) {
    console.error('[Analyst Step] Error:', error);
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream

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

      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
        reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
          typeof ReasoningHistorySchema
        >,
        responseHistory: chunkProcessor.getResponseHistory() as z.infer<
          typeof ResponseHistorySchema
        >,
        metadata: {
          ...inputData.metadata,
          ...filesMetadata,
        },
        selectedFile,
      };
    }

    console.error('Error in analyst step:', error);

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

export const analystStep = createStep({
  id: 'analyst',
  description: 'This step runs the analyst agent to analyze data and create metrics or dashboards.',
  inputSchema,
  outputSchema,
  execute: analystExecution,
});
