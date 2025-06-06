import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
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
import { ThinkAndPrepOutputSchema } from '../utils/memory/types';

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

  let outputMessages = [];
  let finished = false;
  let finalStepData = null;

  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

    if (!threadId || !resourceId) {
      console.error('Missing required context values');
      throw new Error('Missing required context values');
    }

    const initData = await getInitData();
    const prompt = initData.prompt;
    const todos = inputData['create-todos'].todos;

    runtimeContext.set('todos', todos);

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await thinkAndPrepAgent.stream(prompt, {
          threadId: threadId,
          resourceId: resourceId,
          runtimeContext,
          abortSignal: abortController.signal,
          toolChoice: 'required',
          onStepFinish: async (step) => {
            const toolNames = step.toolCalls.map((call) => call.toolName);

            if (
              toolNames.some((toolName) =>
                ['submitThoughtsTool', 'finishAndRespondTool'].includes(toolName)
              )
            ) {
              // Extract and validate messages
              outputMessages = extractMessageHistory(step.response.messages);

              // Store the full step data
              finalStepData = step;

              // Set finished to true if finishAndRespondTool was called
              if (toolNames.includes('finishAndRespondTool')) {
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

    return {
      finished,
      outputMessages,
      stepData: finalStepData,
      metadata: {
        toolsUsed: getAllToolsUsed(outputMessages),
        finalTool: getLastToolUsed(outputMessages) as
          | 'submitThoughtsTool'
          | 'finishAndRespondTool'
          | undefined,
        text: finalStepData?.text,
        reasoning: finalStepData?.reasoning,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }
  }

  return {
    finished,
    outputMessages,
    stepData: finalStepData,
    metadata: {
      toolsUsed: getAllToolsUsed(outputMessages),
      finalTool: getLastToolUsed(outputMessages) as
        | 'submitThoughtsTool'
        | 'finishAndRespondTool'
        | undefined,
      text: finalStepData?.text,
      reasoning: finalStepData?.reasoning,
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
