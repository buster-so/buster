import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

const inputSchema = z.object({
  finished: z.boolean(),
});

const outputSchema = z.object({});

const abortController = new AbortController();

const analystExecution = async ({
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const userId = runtimeContext.get('userId');
  const sessionId = runtimeContext.get('threadId');

  const initData = await getInitData();
  const prompt = initData.prompt;

  const wrappedStream = wrapTraced(
    async () => {
      const stream = await analystAgent.stream(prompt, {
        threadId: sessionId,
        resourceId: userId,
        runtimeContext,
        toolChoice: 'required',
        abortSignal: abortController.signal,
      });

      return stream;
    },
    {
      name: 'Analyst',
    }
  );

  const stream = await wrappedStream();
  for await (const chunk of stream.fullStream) {
    if (chunk.type === 'tool-result' && chunk.toolName === 'doneTool') {
      abortController.abort();
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
