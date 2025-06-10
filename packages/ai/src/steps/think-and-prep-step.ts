import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { parseStreamingArgs as parseFinishAndRespondArgs } from '../tools/communication-tools/finish-and-respond';
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

export const thinkAndPrepOutputSchema = z.object({});

const outputSchema = ThinkAndPrepOutputSchema;

// Helper function for think-and-prep onStepFinish callback
const handleThinkAndPrepStepFinish = async ({
  step,
  messages,
  runtimeContext,
  abortController,
}: {
  step: any;
  messages: CoreMessage[];
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  abortController: AbortController;
}) => {
  const toolNames = step.toolCalls.map((call: any) => call.toolName);
  let outputMessages: MessageHistory = [];
  let finished = false;
  let finalStepData: StepFinishData | null = null;
  let shouldAbort = false;

  if (
    toolNames.some((toolName: string) => ['submitThoughts', 'finishAndRespond'].includes(toolName))
  ) {
    // Extract and validate messages from the step response
    // step.response.messages contains the conversation history for this step
    const agentResponseMessages = extractMessageHistory(step.response.messages);

    // Build complete conversation history: input messages + agent response messages
    // This preserves the user messages along with assistant/tool responses
    outputMessages = [...messages, ...agentResponseMessages];

    // Save conversation history to database before aborting
    try {
      await saveConversationHistoryFromStep(runtimeContext as any, outputMessages);
    } catch (error) {
      console.error('Failed to save think-and-prep conversation history:', error);
      // Continue with abort even if save fails to avoid hanging
    }

    // Store the full step data (cast to our expected type)
    finalStepData = step as any;

    // Set finished to true if finishAndRespondTool was called
    if (toolNames.includes('finishAndRespond')) {
      finished = true;
    }

    shouldAbort = true;
    abortController.abort();
  }

  return {
    outputMessages,
    finished,
    finalStepData,
    shouldAbort,
  };
};

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
      console.error('Missing required context values');
      throw new Error('Missing required context values');
    }

    const initData = await getInitData();
    const prompt = initData.prompt;
    const conversationHistory = initData.conversationHistory;
    const todos = inputData['create-todos'].todos;

    runtimeContext.set('todos', todos);

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // If we have history, append the new prompt to it
      messages = appendToConversation(conversationHistory as any, prompt);
    } else {
      // Otherwise, create a new conversation with just the prompt
      messages = standardizeMessages(prompt);
    }

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await thinkAndPrepAgent.stream(messages, {
          runtimeContext,
          abortSignal: abortController.signal,
          toolChoice: 'required',
          onStepFinish: async (step) => {
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
        });

        return stream;
      },
      {
        name: 'Think and Prep',
      }
    );

    const stream = await wrappedStream();

    // Initialize the tool args parser with think-and-prep tool mappings
    const toolArgsParser = new ToolArgsParser();
    toolArgsParser.registerParser('finish-and-respond', parseFinishAndRespondArgs);
    toolArgsParser.registerParser('sequential-thinking', parseSequentialThinkingArgs);

    for await (const chunk of stream.fullStream) {
      // Process streaming tool arguments
      if (chunk.type === 'tool-call-streaming-start' || chunk.type === 'tool-call-delta') {
        const streamingResult = toolArgsParser.processChunk(chunk);
        if (streamingResult) {
          // TODO: Emit streaming result for real-time UI updates
          // This could be sent via WebSocket, Server-Sent Events, or other streaming mechanism
          console.log(`🧠 [${streamingResult.toolName}] Streaming:`, streamingResult.partialArgs);
        }
      }

      // Keep existing debug logging but make it more selective
      if (chunk.type !== 'tool-call-delta') {
        console.log('=== THINK AND PREP STEP OUTPUT ===');
        console.log('Chunk:', JSON.stringify(chunk, null, 2));
      }
    }

    return {
      finished,
      outputMessages,
      conversationHistory: outputMessages, // Include conversation history for workflow output
      stepData: finalStepData as any,
      metadata: {
        toolsUsed: getAllToolsUsed(outputMessages),
        finalTool: getLastToolUsed(outputMessages) as
          | 'submitThoughts'
          | 'finishAndRespond'
          | undefined,
        text: (finalStepData as any)?.text,
        reasoning: (finalStepData as any)?.reasoning,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }
  }

  console.log('=== THINK AND PREP STEP OUTPUT (CATCH BLOCK) ===');
  console.log('Finished:', finished);
  console.log('Output messages length:', outputMessages.length);
  console.log('Conversation history being returned:', outputMessages);

  return {
    finished,
    outputMessages,
    conversationHistory: outputMessages, // Include conversation history for workflow output
    stepData: finalStepData as any,
    metadata: {
      toolsUsed: getAllToolsUsed(outputMessages),
      finalTool: getLastToolUsed(outputMessages) as
        | 'submitThoughts'
        | 'finishAndRespond'
        | undefined,
      text: (finalStepData as any)?.text,
      reasoning: (finalStepData as any)?.reasoning,
    },
  };
};

export const thinkAndPrepStep = createStep({
  id: 'think-and-prep',
  description:
    'This step runs the think and prep agent to analyze the prompt and prepare thoughts.',
  inputSchema,
  outputSchema,
  execute: thinkAndPrepExecution,
});
