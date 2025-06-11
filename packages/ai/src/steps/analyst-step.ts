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
import { handleInvalidToolCall } from '../utils/handle-invalid-tools/handle-invalid-tool-call';
import {
  MessageHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
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
  metadata: AnalystMetadataSchema.optional(),
});

// Helper function for analyst onStepFinish callback
const handleAnalystStepFinish = async ({
  step,
  inputData,
  runtimeContext,
}: {
  step: StepResult<ToolSet>;
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}) => {
  // Save complete conversation history to database before any abort (think-and-prep + analyst messages)
  const analystResponseMessages = step.response.messages as CoreMessage[];
  const completeConversationHistory = [
    ...(inputData.outputMessages as CoreMessage[]),
    ...analystResponseMessages,
  ];

  const messageId = runtimeContext.get('messageId');

  if (messageId) {
    try {
      await saveConversationHistoryFromStep(messageId, completeConversationHistory);
    } catch (error) {
      console.error('Failed to save analyst conversation history:', error);
      // Continue without aborting - let the natural flow handle completion
    }
  }

  // Check if doneTool was called but don't abort here - let the main stream loop handle it
  const toolNames = step.toolCalls.map((call) => call.toolName);
  const shouldAbort = toolNames.includes('doneTool');

  // Log for debugging but don't abort - this was causing race conditions
  if (shouldAbort) {
    console.log('Done tool detected, allowing natural completion');
  }

  return {
    completeConversationHistory,
    shouldAbort,
  };
};

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const abortController = new AbortController();
  let completeConversationHistory: CoreMessage[] = [];

  try {
    const resourceId = runtimeContext.get('userId');
    const threadId = runtimeContext.get('threadId');

    if (!resourceId || !threadId) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }

    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    const messages = inputData.outputMessages;

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await analystAgent.stream(messages, {
          runtimeContext,
          toolChoice: 'required',
          abortSignal: abortController.signal,
          onStepFinish: async (step: StepResult<ToolSet>) => {
            const result = await handleAnalystStepFinish({
              step,
              inputData,
              runtimeContext,
            });

            completeConversationHistory = result.completeConversationHistory;
          },
          experimental_repairToolCall: handleInvalidToolCall,
        });

        return stream;
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

    for await (const chunk of stream.fullStream) {
      // Process streaming tool arguments
      if (chunk.type === 'tool-call-streaming-start' || chunk.type === 'tool-call-delta') {
        const streamingResult = toolArgsParser.processChunk(chunk);
        if (streamingResult) {
          // TODO: Emit streaming result for real-time UI updates
        }
      }

      if (chunk.type === 'tool-result' && chunk.toolName === 'doneTool') {
        // Return immediately when doneTool completes - this is the natural end
        return {
          conversationHistory: completeConversationHistory,
          finished: true,
          outputMessages: completeConversationHistory,
        };
      }
    }

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream
      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
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
