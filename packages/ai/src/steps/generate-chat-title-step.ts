import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = z.object({
  prompt: z
    .string()
    .describe('The prompt that the user submitted that will be used to extract values.'),
});

export const generateChatTitleOutputSchema = z.object({
  title: z.string().describe('The title for the chat.'),
});

const generateChatTitleInstructions = `
I am a chat title generator that is responsible for generating a title for the chat.
`;

const todosAgent = new Agent({
  name: 'Extract Values',
  instructions: generateChatTitleInstructions,
  model: anthropicCachedModel('anthropic/claude-sonnet-4'),
});

const generateChatTitleExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof generateChatTitleOutputSchema>> => {
  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

    const tracedChatTitle = wrapTraced(
      async () => {
        const response = await todosAgent.generate(inputData.prompt, {
          maxSteps: 0,
          threadId: threadId,
          resourceId: resourceId,
          output: generateChatTitleOutputSchema,
        });

        return response.object;
      },
      {
        name: 'Generate Chat Title',
      }
    );

    const title = await tracedChatTitle();

    return title;
  } catch (error) {
    console.error('Failed to generate chat title:', error);
    // Return a fallback title instead of crashing
    return {
      title: 'New Analysis',
    };
  }
};

export const generateChatTitleStep = createStep({
  id: 'generate-chat-title',
  description: 'This step is a single llm call to quickly generate a title for the chat.',
  inputSchema,
  outputSchema: generateChatTitleOutputSchema,
  execute: generateChatTitleExecution,
});
