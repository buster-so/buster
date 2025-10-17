import { z } from 'zod';

/**
 * Request schema for fetching raw LLM messages from a chat
 * Used when resuming a conversation to load the message history
 */
export const GetRawMessagesRequestParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat ID to fetch messages from'),
});

export type GetRawMessagesRequestParams = z.infer<typeof GetRawMessagesRequestParamsSchema>;

/**
 * Response schema for fetching raw LLM messages
 * Returns the rawLlmMessages array which can be used to resume conversations
 */
export const GetRawMessagesResponseSchema = z.object({
  success: z.boolean().describe('Whether the fetch was successful'),
  chatId: z.string().uuid().describe('ID of the chat'),
  rawLlmMessages: z.unknown().describe('Raw LLM messages from the conversation (ModelMessage[])'),
});

export type GetRawMessagesResponse = z.infer<typeof GetRawMessagesResponseSchema>;
