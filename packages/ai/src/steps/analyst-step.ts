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
import { parseStreamingArgs as parseDoneArgs } from '../tools/communication-tools/done-tool';
import { parseStreamingArgs as parseExecuteSqlArgs } from '../tools/database-tools/execute-sql';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { parseStreamingArgs as parseCreateMetricsArgs } from '../tools/visualization-tools/create-metrics-file-tool';
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
import { ToolArgsParser, createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow'; // Just for input schema types now

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
    id: crypto.randomUUID(),
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

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
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
  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    inputData.reasoningHistory || [], // Pass reasoning history from previous step
    inputData.responseHistory || [] // Pass response history from previous step
  );

  try {
    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    const messages = inputData.outputMessages;

    if (messages && messages.length > 0) {
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
        // Use fallback but continue with debugging
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
              console.error(`Analyst retry attempt ${attemptNumber} for error:`, error);
            },
          },
        });

        // Update messages to include any healing messages added during retries
        if (result.conversationHistory.length > messages.length) {
          // Healing messages were added, update the complete conversation history
          completeConversationHistory = result.conversationHistory;
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

    // Initialize the tool args parser with analyst tool mappings
    const toolArgsParser = new ToolArgsParser();
    toolArgsParser.registerParser('create-metrics-file', parseCreateMetricsArgs);
    toolArgsParser.registerParser('doneTool', parseDoneArgs);
    toolArgsParser.registerParser('execute-sql', parseExecuteSqlArgs);
    toolArgsParser.registerParser('sequential-thinking', parseSequentialThinkingArgs);

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
      // Extract all successfully created/modified files
      const allFiles = extractFilesFromReasoning(chunkProcessor.getReasoningHistory());

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
