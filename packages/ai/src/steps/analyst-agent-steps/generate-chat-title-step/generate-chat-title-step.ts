import { updateChat, updateMessage } from '@buster/database';
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Haiku35 } from '../../../llm';

// Zod-first: define input/output schemas and export inferred types
export const generateChatTitleParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
  chatId: z.string().uuid().describe('The chat ID to update'),
  messageId: z.string().uuid().describe('The message ID to update with title'),
});

export type GenerateChatTitleParams = z.infer<typeof generateChatTitleParamsSchema>;

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  title: z.string().describe('The title for the chat.'),
});

const generateChatTitleInstructions = `
I am a chat title generator that is responsible for generating a title for the chat.

The title should be 3-8 words, capturing the main topic or intent of the conversation. 
With an emphasis on the user's question and most recent converstaion topic.
`;

/**
 * Generates a title using the LLM with conversation context
 */
async function generateTitleWithLLM(messages: ModelMessage[]): Promise<string> {
  try {
    const titleMessages: ModelMessage[] = [
      {
        role: 'system',
        content: generateChatTitleInstructions,
      },
      ...messages,
    ];

    const tracedChatTitle = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: await Haiku35,
          schema: llmOutputSchema,
          messages: titleMessages,
        });

        return object;
      },
      {
        name: 'Generate Chat Title',
      }
    );

    const result = await tracedChatTitle();
    return result.title;
  } catch (llmError) {
    // Handle LLM generation errors specifically
    console.warn('[GenerateChatTitle] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    throw new Error('Failed to generate chat title');
  }
}

/**
 * Updates database records with the generated title
 */
async function updateDatabaseRecords(
  title: string,
  chatId?: string,
  messageId?: string
): Promise<void> {
  const updatePromises: Promise<{ success: boolean }>[] = [];

  if (chatId) {
    updatePromises.push(
      updateChat(chatId, {
        title,
      })
    );
  }

  if (messageId) {
    updatePromises.push(
      updateMessage(messageId, {
        title,
      })
    );
  }

  await Promise.all(updatePromises);
}

export async function runGenerateChatTitleStep({
  messages,
  chatId,
  messageId,
}: GenerateChatTitleParams): Promise<void> {
  let title = 'New Analysis';

  try {
    title = (await generateTitleWithLLM(messages)) ?? 'New Analysis';
  } catch (error) {
    console.error('[GenerateChatTitle] Failed to generate chat title:', error);
  }

  await updateDatabaseRecords(title, chatId, messageId);
}
