import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { parseStreamingArgs as parseDoneArgs } from '../tools/communication-tools/done-tool';
import { parseStreamingArgs as parseExecuteSqlArgs } from '../tools/database-tools/execute-sql';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { parseStreamingArgs as parseCreateMetricsArgs } from '../tools/visualization-tools/create-metrics-file-tool';
import { ChunkProcessor } from '../utils/database/chunkProcessor';
import {
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
import { retryableAgentStream } from '../utils/retry';
import { ToolArgsParser, createOnChunkHandler } from '../utils/streaming';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow'; // Just for input schema types now

const inputSchema = ThinkAndPrepOutputSchema;

// Analyst-specific metadata schema
const AnalystMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  doneTool: z.boolean().optional(),
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
  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    inputData.reasoningHistory || [],
    inputData.responseHistory || []
  );

  try {
    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    const messages = inputData.outputMessages;

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
        const result = await retryableAgentStream({
          agent: analystAgent,
          messages,
          options: {
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
            onRetry: (error, attemptNumber) => {
              // Log retry attempt for debugging
              console.error(`Analyst retry attempt ${attemptNumber} for ${error.type} error`);
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
        console.error('Error processing stream:', streamError);
      }
    }

    // Get final conversation history from chunk processor
    completeConversationHistory = chunkProcessor.getAccumulatedMessages();

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
      reasoningHistory: chunkProcessor.getReasoningHistory() as z.infer<
        typeof ReasoningHistorySchema
      >,
      responseHistory: chunkProcessor.getResponseHistory() as z.infer<typeof ResponseHistorySchema>,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream
      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
        reasoningHistory: chunkProcessor.getReasoningHistory(),
        responseHistory: chunkProcessor.getResponseHistory(),
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
