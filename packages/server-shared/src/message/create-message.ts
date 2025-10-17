import { z } from 'zod';
import type { ChatWithMessages } from '../chats/chat.types';

/**
 * Request schema for creating a message
 * This endpoint supports an upsert pattern:
 * - If the chat exists, it adds a message to it
 * - If the chat doesn't exist, it creates a new chat and adds the message
 *
 * This endpoint is strictly for creating messages and chats.
 * Note: Message metadata and messageAnalysisMode are not needed for this endpoint currently.
 * These may be added in the future if needed.
 */
export const CreateMessageRequestParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat ID - will be created if it does not exist'),
  messageId: z.string().uuid().describe('Message ID for the new message'),
});

export type CreateMessageRequestParams = z.infer<typeof CreateMessageRequestParamsSchema>;

export const CreateMessageRequestBodySchema = z.object({
  prompt: z.string().min(1).describe('User prompt/query for the message'),
});

export type CreateMessageRequestBody = z.infer<typeof CreateMessageRequestBodySchema>;

/**
 * Response schema for creating a message
 * Returns the complete chat with all messages
 */
export const CreateMessageResponseSchema = z.object({
  success: z.boolean().describe('Whether the creation was successful'),
  chatId: z.string().uuid().describe('ID of the chat (existing or newly created)'),
  messageId: z.string().uuid().describe('ID of the created message'),
  chat: z.custom<ChatWithMessages>().describe('Complete chat object with all messages'),
});

export type CreateMessageResponse = z.infer<typeof CreateMessageResponseSchema>;
