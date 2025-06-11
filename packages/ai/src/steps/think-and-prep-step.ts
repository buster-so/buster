import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StepResult, ToolSet } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { parseStreamingArgs as parseRespondWithoutAnalysisArgs } from '../tools/communication-tools/respond-without-analysis';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { saveConversationHistoryFromStep } from '../utils/database/saveConversationHistory';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { ToolArgsParser } from '../utils/streaming';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';
import { createTodosOutputSchema } from './create-todos-step';
import { extractValuesSearchOutputSchema } from './extract-values-search-step';
import { generateChatTitleOutputSchema } from './generate-chat-title-step';

const inputSchema = z.object({
  'create-todos': createTodosOutputSchema,
  'extract-values-search': extractValuesSearchOutputSchema,
  'generate-chat-title': generateChatTitleOutputSchema,
});

import { handleInvalidToolCall } from '../utils/handle-invalid-tools/handle-invalid-tool-call';
import { handleInvalidToolError } from '../utils/handle-invalid-tools/handle-invalid-tool-error';
import {
  extractMessageHistory,
  getAllToolsUsed,
  getLastToolUsed,
} from '../utils/memory/message-history';
import {
  type MessageHistory,
  type StepFinishData,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
import { createTodoToolCallMessage, createTodoToolResultMessage } from '../utils/memory/todos-to-messages';

const outputSchema = ThinkAndPrepOutputSchema;

// Helper function for think-and-prep onStepFinish callback
const handleThinkAndPrepStepFinish = async ({
  step,
  messages,
  runtimeContext,
  abortController,
}: {
  step: StepResult<ToolSet>;
  messages: CoreMessage[];
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  abortController: AbortController;
}) => {
  const toolNames = step.toolCalls.map((call) => call.toolName);
  let outputMessages: MessageHistory = [];
  let finished = false;
  let finalStepData: StepFinishData | null = null;
  let shouldAbort = false;

  // Add delay to prevent race conditions with tool call repairs
  const hasFinishingTools = toolNames.some((toolName: string) =>
    ['submitThoughts', 'respondWithoutAnalysis'].includes(toolName)
  );

  if (hasFinishingTools) {
    try {
      // Extract and validate messages from the step response
      // step.response.messages contains the conversation history for this step
      const agentResponseMessages = extractMessageHistory(step.response.messages);

      // Build complete conversation history: input messages + agent response messages
      // This preserves the user messages along with assistant/tool responses
      outputMessages = [...messages, ...agentResponseMessages];

      const messageId = runtimeContext.get('messageId');

      if (messageId) {
        // Save conversation history to database before aborting
        try {
          await saveConversationHistoryFromStep(messageId, outputMessages);
        } catch (error) {
          console.error('Failed to save think-and-prep conversation history:', error);
          // Continue with abort even if save fails to avoid hanging
        }
      }

      // Note: Could transform step data to StepFinishData format if needed in the future
      // For now, we'll leave finalStepData as null since the types are incompatible
      // and the step data is not critical for the workflow to function properly
      finalStepData = null;

      // Set finished to true if respondWithoutAnalysis was called
      if (toolNames.includes('respondWithoutAnalysis')) {
        finished = true;
      }

      // Add a small delay to ensure any pending tool call repairs complete
      // before aborting the stream
      await new Promise((resolve) => setTimeout(resolve, 100));

      shouldAbort = true;

      // Use a try-catch around abort to handle any potential errors
      try {
        abortController.abort();
      } catch (abortError) {
        console.warn('Error during abort controller signal:', abortError);
        // Continue execution even if abort fails
      }
    } catch (error) {
      console.error('Error in handleThinkAndPrepStepFinish:', error);
      // Don't abort on error to prevent hanging
      shouldAbort = false;
    }
  }

  return {
    outputMessages,
    finished,
    finalStepData,
    shouldAbort,
  };
};

// Helper function to process stream chunks
const processStreamChunks = async (stream: any, toolArgsParser: ToolArgsParser): Promise<void> => {
  for await (const chunk of stream.fullStream) {
    try {
      if (chunk.type === 'tool-call-streaming-start' || chunk.type === 'tool-call-delta') {
        const streamingResult = toolArgsParser.processChunk(chunk);
        if (streamingResult) {
          // TODO: Emit streaming result for real-time UI updates
        }
      }
    } catch (chunkError) {
      console.warn('Error processing stream chunk:', chunkError);
    }
  }
};

// Helper function to create the result object
const createStepResult = (
  finished: boolean,
  outputMessages: MessageHistory,
  finalStepData: StepFinishData | null
): z.infer<typeof outputSchema> => ({
  finished,
  outputMessages,
  conversationHistory: outputMessages,
  stepData: finalStepData || undefined,
  metadata: {
    toolsUsed: getAllToolsUsed(outputMessages),
    finalTool: getLastToolUsed(outputMessages) as
      | 'submitThoughts'
      | 'respondWithoutAnalysis'
      | undefined,
    text: undefined,
    reasoning: undefined,
  },
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

  let outputMessages: MessageHistory = [];
  let finished = false;
  let finalStepData: StepFinishData | null = null;

  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

    if (!threadId || !resourceId) {
      throw new Error('Missing required context values');
    }

    const initData = await getInitData();
    const todos = inputData['create-todos'].todos;

    const baseMessages =
      initData.conversationHistory && initData.conversationHistory.length > 0
        ? appendToConversation(initData.conversationHistory, initData.prompt)
        : standardizeMessages(initData.prompt);

    // Create todo messages and inject them into the conversation history
    const todoCallMessage = createTodoToolCallMessage(todos);
    const todoResultMessage = createTodoToolResultMessage(todos);
    const messages = [...baseMessages, todoCallMessage, todoResultMessage];

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await thinkAndPrepAgent.stream(messages, {
          runtimeContext,
          abortSignal: abortController.signal,
          toolChoice: 'required',
          onStepFinish: async (step: StepResult<ToolSet>) => {
            const result = await handleThinkAndPrepStepFinish({
              step,
              messages,
              runtimeContext,
              abortController,
            });

            outputMessages = result.outputMessages;
            finished = result.finished;
            finalStepData = result.finalStepData;
          },
          onError: handleInvalidToolError,
          experimental_repairToolCall: handleInvalidToolCall,
        });

        return stream;
      },
      {
        name: 'Think and Prep',
      }
    );

    const stream = await wrappedStream();
    const toolArgsParser = new ToolArgsParser();
    toolArgsParser.registerParser('respond-without-analysis', parseRespondWithoutAnalysisArgs);
    toolArgsParser.registerParser('sequential-thinking', parseSequentialThinkingArgs);

    await processStreamChunks(stream, toolArgsParser);
    return createStepResult(finished, outputMessages, finalStepData);
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error(`Error in think and prep step: ${error.message}`);
    }
    return createStepResult(finished, outputMessages, finalStepData);
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
