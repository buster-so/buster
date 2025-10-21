import type { ModelMessage } from '@buster/ai';
import type { BusterSDK } from '@buster/sdk';
import type { GetChatsListRequest } from '@buster/server-shared/chats';
import { z } from 'zod';

/**
 * Schema for API-based conversation (no local file storage)
 */
export const ApiConversationSchema = z.object({
  chatId: z.string().uuid().describe('Unique chat/conversation ID'),
  modelMessages: z
    .custom<ModelMessage[]>()
    .describe('Array of ModelMessage objects (user, assistant, tool)'),
});

export type ApiConversation = z.infer<typeof ApiConversationSchema>;

/**
 * Schema for conversation list item from API
 */
export const ApiConversationListItemSchema = z.object({
  chatId: z.string().describe('Unique chat ID'),
  name: z.string().describe('Chat name'),
  createdAt: z.string().datetime().describe('ISO timestamp when chat was created'),
  updatedAt: z.string().datetime().describe('ISO timestamp when chat was last updated'),
});

export type ApiConversationListItem = z.infer<typeof ApiConversationListItemSchema>;

/**
 * Loads a conversation from the API
 * Returns null if the conversation doesn't exist or on error
 *
 * @param chatId - The unique chat ID
 * @param sdk - BusterSDK instance
 * @returns ApiConversation or null
 */
export async function loadConversationFromApi(
  chatId: string,
  sdk: BusterSDK
): Promise<ApiConversation | null> {
  try {
    const response = await sdk.messages.getRawMessages(chatId);

    // Check if response indicates success
    if (!response.success || !response.rawLlmMessages) {
      return null;
    }

    return {
      chatId,
      modelMessages: response.rawLlmMessages as ModelMessage[],
    };
  } catch (_error) {
    // Handle errors (404, network errors, etc.) by returning null
    return null;
  }
}

/**
 * Lists all conversations from the API
 * Returns empty array on error
 *
 * CLI always filters for data_engineer chat type
 *
 * @param sdk - BusterSDK instance
 * @param params - Optional pagination parameters
 * @returns Array of conversation list items
 */
export async function listConversationsFromApi(
  sdk: BusterSDK,
  params?: GetChatsListRequest
): Promise<ApiConversationListItem[]> {
  try {
    // CLI always uses data_engineer chat type
    const response = await sdk.chats.list({
      ...params,
      chat_type: 'data_engineer',
    });

    // Transform API response to our format
    return response.data.map((item) => ({
      chatId: item.id,
      name: item.name,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (_error) {
    // Handle errors by returning empty array
    return [];
  }
}
