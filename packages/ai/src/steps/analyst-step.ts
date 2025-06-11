import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import type { StepResult, ToolSet } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { parseStreamingArgs as parseDoneArgs } from '../tools/communication-tools/done-tool';
import { parseStreamingArgs as parseExecuteSqlArgs } from '../tools/database-tools/execute-sql';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { parseStreamingArgs as parseCreateMetricsArgs } from '../tools/visualization-tools/create-metrics-file-tool';
import { saveConversationHistoryFromStep } from '../utils/database/saveConversationHistory';
import {
  MessageHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
} from '../utils/memory/types';
import type { 
  BusterChatMessageReasoning,
  BusterChatMessageResponse
} from '../utils/memory/message-converters';
import { retryableAgentStream } from '../utils/retry';
import { ToolArgsParser } from '../utils/streaming';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

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

// Helper function for analyst onStepFinish callback
const handleAnalystStepFinish = async ({
  step,
  inputData,
  runtimeContext,
  abortController,
  accumulatedReasoningHistory,
  accumulatedResponseHistory,
}: {
  step: StepResult<ToolSet>;
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  abortController: AbortController;
  accumulatedReasoningHistory: BusterChatMessageReasoning[];
  accumulatedResponseHistory: BusterChatMessageResponse[];
}) => {
  const toolNames = step.toolCalls.map((call) => call.toolName);
  let completeConversationHistory: CoreMessage[] = [];
  let finished = false;
  let shouldAbort = false;
  let reasoningHistory: BusterChatMessageReasoning[] = [...accumulatedReasoningHistory];
  let responseHistory: BusterChatMessageResponse[] = [...accumulatedResponseHistory];

  // Save conversation history for all tool calls
  const messageId = runtimeContext.get('messageId');
  if (messageId && step.response.messages.length > 0) {
    try {
      const { newReasoningMessages, newResponseMessages } = await saveConversationHistoryFromStep(
        messageId,
        step.response.messages,
        reasoningHistory,
        responseHistory
      );
      // Update the histories with the new messages
      reasoningHistory.push(...(newReasoningMessages as BusterChatMessageReasoning[]));
      responseHistory.push(...(newResponseMessages as BusterChatMessageResponse[]));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  // Check if doneTool was called
  const hasFinishingTools = toolNames.includes('doneTool');

  if (hasFinishingTools) {
    try {
      // Extract and validate messages from the step response
      if (!Array.isArray(step.response.messages)) {
        throw new Error('Invalid step.response.messages: expected array');
      }
      const analystResponseMessages = step.response.messages;

      // Build complete conversation history: input messages + agent response messages
      if (!Array.isArray(inputData.outputMessages)) {
        throw new Error('Invalid inputData.outputMessages: expected array');
      }
      completeConversationHistory = [
        ...inputData.outputMessages,
        ...analystResponseMessages,
      ];

      const messageId = runtimeContext.get('messageId');

      if (messageId) {
        // Save conversation history to database before aborting
        try {
          const { newReasoningMessages, newResponseMessages } = await saveConversationHistoryFromStep(
            messageId, 
            completeConversationHistory, 
            reasoningHistory, 
            responseHistory
          );
          // Update the histories with the new messages
          reasoningHistory.push(...(newReasoningMessages as BusterChatMessageReasoning[]));
          responseHistory.push(...(newResponseMessages as BusterChatMessageResponse[]));
        } catch (saveError) {
          console.error('Failed to save conversation history:', saveError);
          // Continue with abort even if save fails to avoid hanging
        }
      }

      // Set finished to true when doneTool is called
      if (toolNames.includes('doneTool')) {
        finished = true;
      }

      // Add a delay to ensure any pending tool call repairs and stream processing complete
      // before aborting the stream. This prevents race conditions with ongoing chunk processing.
      await new Promise((resolve) => setTimeout(resolve, 250));

      shouldAbort = true;

      // Use a try-catch around abort to handle any potential errors
      try {
        abortController.abort();
      } catch (abortError) {
        console.error('Failed to abort controller:', abortError);
        // Continue execution even if abort fails
      }
    } catch (error) {
      console.error('Error in handleAnalystStepFinish:', error);
      // Don't abort on error to prevent hanging
      shouldAbort = false;
    }
  }

  return {
    completeConversationHistory,
    finished,
    shouldAbort,
    reasoningHistory,
    responseHistory,
  };
};

// Helper function to process stream chunks
const processStreamChunks = async <T extends ToolSet>(
  stream: StreamTextResult<T, unknown>,
  toolArgsParser: ToolArgsParser,
  abortController: AbortController
): Promise<void> => {
  try {
    for await (const chunk of stream.fullStream) {
      // Check if we should abort before processing each chunk
      if (abortController.signal.aborted) {
        break;
      }

      try {
        // Process streaming tool arguments
        if (chunk.type === 'tool-call-streaming-start' || chunk.type === 'tool-call-delta') {
          const streamingResult = toolArgsParser.processChunk(chunk);
          if (streamingResult) {
            // TODO: Emit streaming result for real-time UI updates
          }
        }
      } catch (chunkError) {
        // Log individual chunk processing errors but continue with other chunks
        console.error('Error processing individual stream chunk:', chunkError);
      }
    }
  } catch (streamError) {
    // Handle AbortError gracefully - this is expected when the stream is intentionally aborted
    if (streamError instanceof Error && streamError.name === 'AbortError') {
      // Stream was intentionally aborted, this is normal behavior
      return;
    }
    // Log other stream processing errors but don't throw to avoid breaking the workflow
    console.error('Error processing stream chunks in analyst step:', streamError);
  }
};

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
  let completeConversationHistory: CoreMessage[] = [];
  // Initialize histories from input data (passed from think-and-prep step)
  let reasoningHistory: BusterChatMessageReasoning[] = inputData.reasoningHistory || [];
  let responseHistory: BusterChatMessageResponse[] = inputData.responseHistory || [];

  try {
    const resourceId = runtimeContext.get('userId');
    const threadId = runtimeContext.get('threadId');

    if (!resourceId || !threadId) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }

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

    const wrappedStream = wrapTraced(
      async () => {
        const result = await retryableAgentStream({
          agent: analystAgent,
          messages,
          options: {
            runtimeContext,
            toolChoice: 'required',
            abortSignal: abortController.signal,
            onStepFinish: async (step: StepResult<ToolSet>) => {
              const stepResult = await handleAnalystStepFinish({
                step,
                inputData,
                runtimeContext,
                abortController,
                accumulatedReasoningHistory: reasoningHistory,
                accumulatedResponseHistory: responseHistory,
              });

              completeConversationHistory = stepResult.completeConversationHistory;
              reasoningHistory = stepResult.reasoningHistory;
              responseHistory = stepResult.responseHistory;
            },
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

    await processStreamChunks(stream, toolArgsParser, abortController);

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
      reasoningHistory,
      responseHistory,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream
      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
        reasoningHistory,
        responseHistory,
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
