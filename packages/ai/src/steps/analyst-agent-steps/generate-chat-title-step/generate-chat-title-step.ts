import { updateChat, updateMessage } from '@buster/database/queries';
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Haiku35 } from '../../../llm';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../../llm/providers/gateway';

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
You are a chat title generator. Your job is to create short, clear titles (3–8 words) that summarize the user’s request or the main task of the conversation.

Guidelines:
- Use simple, natural language that closely matches the user’s phrasing.
- Focus on the core action or subject (not generic report-like phrases).
- Avoid jargon, academic, or overly formal wording.
- Prefer plain, direct titles over abstract ones.

Examples:
User: “build me a small report about sales over time, only one metric please.”
Title: “Sales Over Time” (NOT “Sales Performance Trend Analysis”)

User: “Look at the documentation and return 12 data requests that push schema assumptions.”
Title: “Challenging Data Request Examples” (NOT “Challenging JSON Schema Inference Scenarios”)

User: "can you build a report that shows me churn rate by customer segment.”
Title: “Churn Rate by Segment”
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
          model: Haiku35,
          schema: llmOutputSchema,
          messages: titleMessages,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
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
