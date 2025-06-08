import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import { saveConversationHistoryFromStep } from '../utils/database/saveConversationHistory';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
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

    console.log('=== THINK AND PREP STEP INPUT ===');
    console.log('Prompt:', prompt);
    console.log('Conversation history length:', conversationHistory?.length || 0);
    console.log('Conversation history (detailed):', JSON.stringify(conversationHistory, null, 2));

    runtimeContext.set('todos', todos);

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // If we have history, append the new prompt to it
      messages = appendToConversation(conversationHistory as any, prompt);
      console.log('Using existing conversation history, appended new prompt');
    } else {
      // Otherwise, create a new conversation with just the prompt
      messages = standardizeMessages(prompt);
      console.log('No conversation history, creating new conversation');
    }
    console.log('Messages prepared for agent:', messages.length);
    console.log('Messages being sent to agent:', JSON.stringify(messages, null, 2));

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await thinkAndPrepAgent.stream(messages, {
          runtimeContext,
          abortSignal: abortController.signal,
          toolChoice: 'required',
          onStepFinish: async (step) => {
            const toolNames = step.toolCalls.map((call) => call.toolName);

            if (
              toolNames.some((toolName) =>
                ['submitThoughts', 'finishAndRespond'].includes(toolName)
              )
            ) {
              // Extract and validate messages from the step response
              // step.response.messages contains the conversation history for this step
              const agentResponseMessages = extractMessageHistory(step.response.messages);

              // Build complete conversation history: input messages + agent response messages
              // This preserves the user messages along with assistant/tool responses
              outputMessages = [...messages, ...agentResponseMessages];

              console.log('Input messages sent to agent:', messages.length);
              console.log('Agent response messages:', agentResponseMessages.length);
              console.log('Complete conversation history:', outputMessages.length);

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

              abortController.abort();
            }
          },
        });

        return stream;
      },
      {
        name: 'Think and Prep',
      }
    );

    const stream = await wrappedStream();

    for await (const _ of stream.fullStream) {
    }

    console.log('=== THINK AND PREP STEP OUTPUT ===');
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
