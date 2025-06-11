import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StepResult, StreamTextResult, ToolSet } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { parseStreamingArgs as parseRespondWithoutAnalysisArgs } from '../tools/communication-tools/respond-without-analysis';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { saveConversationHistoryFromStep } from '../utils/database/saveConversationHistory';
import { retryableAgentStream } from '../utils/retry';
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
import {
  extractMessageHistory,
  getAllToolsUsed,
  getLastToolUsed,
} from '../utils/memory/message-history';
import { createTodoToolCallMessage } from '../utils/memory/todos-to-messages';
import {
  type MessageHistory,
  type StepFinishData,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
import { 
  extractMessagesFromToolCalls, 
  type BusterChatMessageReasoning,
  type BusterChatMessageResponse 
} from '../utils/memory/message-converters';

const outputSchema = ThinkAndPrepOutputSchema;

// Helper function for think-and-prep onStepFinish callback
const handleThinkAndPrepStepFinish = async ({
  step,
  messages,
  runtimeContext,
  abortController,
  accumulatedReasoningHistory,
  accumulatedResponseHistory,
}: {
  step: StepResult<ToolSet>;
  messages: CoreMessage[];
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  abortController: AbortController;
  accumulatedReasoningHistory: BusterChatMessageReasoning[];
  accumulatedResponseHistory: BusterChatMessageResponse[];
}) => {
  const toolNames = step.toolCalls.map((call) => call.toolName);
  let outputMessages: MessageHistory = [];
  let finished = false;
  let finalStepData: StepFinishData | null = null;
  let shouldAbort = false;
  let reasoningHistory: BusterChatMessageReasoning[] = [...accumulatedReasoningHistory];
  let responseHistory: BusterChatMessageResponse[] = [...accumulatedResponseHistory];

  // Add delay to prevent race conditions with tool call repairs
  const hasFinishingTools = toolNames.some((toolName: string) =>
    ['submitThoughts', 'respondWithoutAnalysis'].includes(toolName)
  );

  // Process tool calls to extract reasoning and response messages
  if (step.toolCalls.length > 0) {
    // Create a map of tool results from the step
    const toolResultsMap = new Map<string, string | null>();
    
    // For tool results, we need to look at the tool response messages
    const toolResponses = step.response.messages.filter(msg => msg.role === 'tool');
    for (const toolResponse of toolResponses) {
      if ('toolCallId' in toolResponse && 'content' in toolResponse) {
        const content = toolResponse.content;
        if (typeof content === 'string') {
          toolResultsMap.set(toolResponse.toolCallId, content);
        }
      }
    }

    // Convert tool calls to messages
    const { reasoningMessages, responseMessages } = extractMessagesFromToolCalls(
      step.toolCalls as any,
      toolResultsMap
    );

    // Add to history
    reasoningHistory.push(...reasoningMessages);
    responseHistory.push(...responseMessages);
  }

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
          await saveConversationHistoryFromStep(messageId, outputMessages, reasoningHistory, responseHistory);
        } catch {
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

      // Add a delay to ensure any pending tool call repairs and stream processing complete
      // before aborting the stream. This prevents race conditions with ongoing chunk processing.
      await new Promise((resolve) => setTimeout(resolve, 250));

      shouldAbort = true;

      // Use a try-catch around abort to handle any potential errors
      try {
        abortController.abort();
      } catch {
        // Continue execution even if abort fails
      }
    } catch {
      // Don't abort on error to prevent hanging
      shouldAbort = false;
    }
  }

  return {
    outputMessages,
    finished,
    finalStepData,
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
    console.error('Error processing stream chunks in think-and-prep step:', streamError);
  }
};

// Helper function to create the result object
const createStepResult = (
  finished: boolean,
  outputMessages: MessageHistory,
  finalStepData: StepFinishData | null,
  reasoningHistory: BusterChatMessageReasoning[] = [],
  responseHistory: BusterChatMessageResponse[] = []
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
  let reasoningHistory: BusterChatMessageReasoning[] = [];
  let responseHistory: BusterChatMessageResponse[] = [];

  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

    if (!threadId || !resourceId) {
      throw new Error('Missing required context values');
    }

    const initData = await getInitData();
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
    const messages = [...baseMessages, todoCallMessage];

    const wrappedStream = wrapTraced(
      async () => {
        const result = await retryableAgentStream({
          agent: thinkAndPrepAgent,
          messages,
          options: {
            runtimeContext,
            abortSignal: abortController.signal,
            toolChoice: 'required',
            onStepFinish: async (step: StepResult<ToolSet>) => {
              const stepResult = await handleThinkAndPrepStepFinish({
                step,
                messages,
                runtimeContext,
                abortController,
                accumulatedReasoningHistory: reasoningHistory,
                accumulatedResponseHistory: responseHistory,
              });

              outputMessages = stepResult.outputMessages;
              finished = stepResult.finished;
              finalStepData = stepResult.finalStepData;
              reasoningHistory = stepResult.reasoningHistory;
              responseHistory = stepResult.responseHistory;
            },
          },
          retryConfig: {
            maxRetries: 3,
            onRetry: (error, attemptNumber) => {
              // Log retry attempt for debugging
              console.error(
                `Think and Prep retry attempt ${attemptNumber} for ${error.type} error`
              );
            },
          },
        });

        // Update messages to include any healing messages added during retries
        messages.length = 0;
        messages.push(...result.conversationHistory);

        return result.stream;
      },
      {
        name: 'Think and Prep',
      }
    );

    const stream = await wrappedStream();
    const toolArgsParser = new ToolArgsParser();
    toolArgsParser.registerParser('respond-without-analysis', parseRespondWithoutAnalysisArgs);
    toolArgsParser.registerParser('sequential-thinking', parseSequentialThinkingArgs);

    try {
      await processStreamChunks(stream, toolArgsParser, abortController);
    } catch (processError) {
      // Log processing errors but continue with the conversation history we have
      console.error('Error in processStreamChunks:', processError);
    }

    return createStepResult(finished, outputMessages, finalStepData, reasoningHistory, responseHistory);
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error(`Error in think and prep step: ${error.message}`);
    }
    return createStepResult(finished, outputMessages, finalStepData, reasoningHistory, responseHistory);
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
