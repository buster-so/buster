import { z } from 'zod';

/**
 * Request schema for updating a message
 * This endpoint allows updating the isCompleted status and rawLlmMessages fields
 */
export const UpdateMessageRequestParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat ID'),
  messageId: z.string().uuid().describe('Message ID to update'),
});

export type UpdateMessageRequestParams = z.infer<typeof UpdateMessageRequestParamsSchema>;

export const UpdateMessageRequestBodySchema = z.object({
  isCompleted: z.boolean().optional().describe('Whether the message is completed'),
  rawLlmMessages: z.unknown().optional().describe('Raw LLM messages from the conversation'),
});

export type UpdateMessageRequestBody = z.infer<typeof UpdateMessageRequestBodySchema>;

/**
 * Response schema for updating a message
 */
export const UpdateMessageResponseSchema = z.object({
  success: z.boolean().describe('Whether the update was successful'),
  messageId: z.string().uuid().describe('ID of the updated message'),
});

export type UpdateMessageResponse = z.infer<typeof UpdateMessageResponseSchema>;
