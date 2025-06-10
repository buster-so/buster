import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

const inputSchema = z.object({
  // This step receives initial workflow input through getInitData
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
  model: anthropicCachedModel('claude-sonnet-4-20250514'),
});

const generateChatTitleExecution = async ({
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof generateChatTitleOutputSchema>> => {
  try {
    const threadId = runtimeContext.get('threadId');
    const resourceId = runtimeContext.get('userId');

    // Get the workflow input data
    const initData = await getInitData();
    const prompt = initData.prompt;
    const conversationHistory = initData.conversationHistory;

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory as CoreMessage[], prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    const tracedChatTitle = wrapTraced(
      async () => {
        const response = await todosAgent.generate(messages, {
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
