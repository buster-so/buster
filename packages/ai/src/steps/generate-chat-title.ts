import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import type { AnalystWorkflowRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = z.object({
  prompt: z
    .string()
    .describe('The prompt that the user submitted that will be used to extract values.'),
});

const outputSchema = z.object({
  title: z.string().describe('The title for the chat.'),
});

const generateChatTitleInstructions = `
I am a chat title generator that is responsible for generating a title for the chat.
`;

const todosAgent = new Agent({
  name: 'Extract Values',
  instructions: generateChatTitleInstructions,
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
});

const generateChatTitleExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystWorkflowRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const threadId = runtimeContext.get('threadId');
  const resourceId = runtimeContext.get('userId');

  const response = await todosAgent.generate(inputData.prompt, {
    maxSteps: 0,
    threadId: threadId,
    resourceId: resourceId,
    output: outputSchema,
  });

  return response.object;
};

export const generateChatTitleStep = createStep({
  id: 'generate-chat-title',
  description: 'This step is a single llm call to quickly generate a title for the chat.',
  inputSchema,
  outputSchema,
  execute: generateChatTitleExecution,
});
