import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import type {
  AnalystWorkflowRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

const inputSchema = z.object({});

const outputSchema = z.object({});

const abortSignal = new AbortController();

const analystExecution = async ({
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystWorkflowRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const userId = runtimeContext.get('userId');
  const sessionId = runtimeContext.get('threadId');

  const initData = await getInitData();
  const prompt = initData.prompt;

  try {
    await analystAgent.generate(prompt, {
      maxSteps: 15,
      threadId: sessionId,
      resourceId: userId,
      abortSignal: abortSignal.signal,
      onStepFinish: (step) => {
        if (step.toolResults.some((result) => result.toolName === 'done')) {
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

export const analystStep = createStep({
  id: 'analyst',
  description: 'This step runs the analyst agent to analyze data and create metrics or dashboards.',
  inputSchema,
  outputSchema,
  execute: analystExecution,
});
