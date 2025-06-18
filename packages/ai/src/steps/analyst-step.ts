import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../server/src/types/chat-types/chat-message.type';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { ChunkProcessor } from '../utils/database/chunk-processor';
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

// File tracking types
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  ymlContent?: string;
}

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
 * Extract successfully created/modified files from reasoning history
 */
function extractFilesFromReasoning(
  reasoningHistory: ChatMessageReasoningMessage[]
): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  for (const entry of reasoningHistory) {
    // Only process file entries with completed status
    if (entry.type === 'files' && entry.status === 'completed' && entry.files) {
      for (const fileId of entry.file_ids || []) {
        const file = entry.files[fileId];
        if (file && file.status === 'completed') {
          files.push({
            id: fileId,
            fileType: file.file_type as 'metric' | 'dashboard',
            fileName: file.file_name,
            status: 'completed',
            ymlContent: file.file?.text,
          });
        }
      }
    }
  }

  return files;
}

/**
 * Apply intelligent selection logic for files to return
 * Priority: dashboards > multiple metrics > single metric
 */
function selectFilesForResponse(files: ExtractedFile[]): ExtractedFile[] {
  // Separate dashboards and metrics
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const metrics = files.filter((f) => f.fileType === 'metric');

  // Apply priority logic
  if (dashboards.length > 0) {
    return dashboards; // Return all dashboards
  }
  if (metrics.length > 0) {
    return metrics; // Return all metrics
  }

  return []; // No files to return
}

/**
 * Create file response messages for selected files
 */
function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => ({
    id: file.id, // Use the actual file ID instead of generating a new UUID
    type: 'file' as const,
    file_type: file.fileType,
    file_name: file.fileName,
    version_number: 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'completed' as const,
        message: `${file.fileType === 'dashboard' ? 'Dashboard' : 'Metric'} created successfully`,
        timestamp: Date.now(),
      },
    ],
  }));
}

/**
 * Create a unique key for a message to detect duplicates
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
      return `${msg.role}:toolcalls:${toolCallIds}`;
    }
  }
  // For other messages, use role and content
  return `${msg.role}:${JSON.stringify(msg.content)}`;
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

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    transformedReasoning, // Pass transformed reasoning history
    transformedResponse // Pass transformed response history
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

    // Check if done tool was called and extract files for response
    let enhancedResponseHistory = chunkProcessor.getResponseHistory();
    let filesMetadata = {};

    if (chunkProcessor.hasFinishingTool() && chunkProcessor.getFinishingToolName() === 'doneTool') {
      // Log reasoning history to debug file statuses
      const reasoningHistory = chunkProcessor.getReasoningHistory();

      // Extract all successfully created/modified files
      const allFiles = extractFilesFromReasoning(reasoningHistory);

      // Apply intelligent selection logic
      const selectedFiles = selectFilesForResponse(allFiles);

      // Create file response messages for selected files
      const fileResponseMessages = createFileResponseMessages(selectedFiles);

      // Add file response messages to the chunk processor's internal state
      // This ensures they're included in any subsequent saves and aren't overwritten
      await chunkProcessor.addResponseMessages(fileResponseMessages);

      // Get the updated response history including our new file messages
      enhancedResponseHistory = chunkProcessor.getResponseHistory();

      // Add metadata about files
      filesMetadata = {
        filesCreated: allFiles.length,
        filesReturned: selectedFiles.length,
      };
    }

    // One final save to ensure file messages are persisted
    if (
      'filesReturned' in filesMetadata &&
      (filesMetadata as { filesReturned: number }).filesReturned > 0
    ) {
      await chunkProcessor.saveToDatabase();
    }

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
      reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
        typeof ReasoningHistorySchema
      >,
      responseHistory: enhancedResponseHistory as z.infer<typeof ResponseHistorySchema>,
      metadata: {
        ...inputData.metadata,
        ...filesMetadata,
      },
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream

      // Check if done tool was called and extract files for response even in abort case
      let enhancedResponseHistory = chunkProcessor.getResponseHistory();
      let filesMetadata = {};

      if (
        chunkProcessor.hasFinishingTool() &&
        chunkProcessor.getFinishingToolName() === 'doneTool'
      ) {
        const allFiles = extractFilesFromReasoning(chunkProcessor.getReasoningHistory());
        const selectedFiles = selectFilesForResponse(allFiles);
        const fileResponseMessages = createFileResponseMessages(selectedFiles);

        // Add file response messages to the chunk processor's internal state
        await chunkProcessor.addResponseMessages(fileResponseMessages);

        // Get the updated response history including our new file messages
        enhancedResponseHistory = chunkProcessor.getResponseHistory();

        filesMetadata = {
          filesCreated: allFiles.length,
          filesReturned: selectedFiles.length,
        };
      }

      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
        reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
          typeof ReasoningHistorySchema
        >,
        responseHistory: enhancedResponseHistory as z.infer<typeof ResponseHistorySchema>,
        metadata: {
          ...inputData.metadata,
          ...filesMetadata,
        },
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
