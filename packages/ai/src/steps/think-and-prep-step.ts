import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { parseStreamingArgs as parseRespondWithoutAnalysisArgs } from '../tools/communication-tools/respond-without-analysis';
import { parseStreamingArgs as parseSequentialThinkingArgs } from '../tools/planning-thinking-tools/sequential-thinking-tool';
import { ChunkProcessor } from '../utils/database/chunkProcessor';
import { retryableAgentStream } from '../utils/retry';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { ToolArgsParser, createOnChunkHandler } from '../utils/streaming';
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
import type {
  BusterChatMessageReasoning,
  BusterChatMessageResponse,
} from '../utils/memory/message-converters';
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

const outputSchema = ThinkAndPrepOutputSchema;

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
  const messageId = runtimeContext.get('messageId') as string | null;

  let outputMessages: MessageHistory = [];
  let finished = false;
  const finalStepData: StepFinishData | null = null;

  // Initialize chunk processor with initial messages
  const chunkProcessor = new ChunkProcessor(messageId, [], [], []);

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

    // Update chunk processor with initial messages
    chunkProcessor.setInitialMessages(messages);

    const wrappedStream = wrapTraced(
      async () => {
        const result = await retryableAgentStream({
          agent: thinkAndPrepAgent,
          messages,
          options: {
            runtimeContext,
            abortSignal: abortController.signal,
            toolChoice: 'required',
            onChunk: createOnChunkHandler({
              chunkProcessor,
              abortController,
              finishingToolNames: ['submitThoughts', 'respondWithoutAnalysis'],
              onFinishingTool: () => {
                // Only set finished = true for respondWithoutAnalysis
                // submitThoughts should continue to analyst agent
                const finishingToolName = chunkProcessor.getFinishingToolName();
                if (finishingToolName === 'respondWithoutAnalysis') {
                  finished = true;
                }
              },
            }),
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
        if (Array.isArray(messages) && Array.isArray(result.conversationHistory)) {
          messages.length = 0;
          messages.push(...result.conversationHistory);
        } else {
          console.error('Invalid messages or conversationHistory array');
        }

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

    // Get final results from chunk processor
    outputMessages = extractMessageHistory(chunkProcessor.getAccumulatedMessages());

    return createStepResult(
      finished,
      outputMessages,
      finalStepData,
      chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[]
    );
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error(`Error in think and prep step: ${error.message}`);
    }
    return createStepResult(
      finished,
      outputMessages,
      finalStepData,
      chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[]
    );
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
