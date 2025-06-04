import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
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

export const thinkAndPrepOutputSchema = z.object({});

const outputSchema = z.object({});

const abortSignal = new AbortController();

const thinkAndPrepExecution = async ({
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const threadId = runtimeContext.get('threadId');
  const resourceId = runtimeContext.get('userId');

  const initData = await getInitData();

  const prompt = initData.prompt;

  try {
    await thinkAndPrepAgent.generate(prompt, {
      maxSteps: 15,
      threadId: threadId,
      resourceId: resourceId,
      runtimeContext,
      abortSignal: abortSignal.signal,
      onStepFinish: (step) => {
        if (step.toolResults.some((result) => result.toolName === 'submit-thoughts')) {
          abortSignal.abort();
        }
      },
    });
  } catch (error) {
    if (error instanceof AbortSignal) {
      return {};
    }
  }

  return {};
};

export const thinkAndPrepStep = createStep({
  id: 'think-and-prep',
  description:
    'This step runs the think and prep agent to analyze the prompt and prepare thoughts.',
  inputSchema,
  outputSchema,
  execute: thinkAndPrepExecution,
});
