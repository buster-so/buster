import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities';

// Pagination parameters for chat list
export const GetChatsListRequestSchema = z.object({
  page_token: z.number().optional().default(0),
  page_size: z.number().optional().default(1000),
});

export type GetChatsListRequest = z.infer<typeof GetChatsListRequestSchema>;

export const GetChatsRequestSchemaV2 = PaginatedRequestSchema;
export type GetChatsRequestV2 = z.infer<typeof GetChatsRequestSchemaV2>;

// Request for getting a single chat
export const GetChatRequestParamsSchema = z.object({
  id: z.string(),
});

export const GetChatRequestQuerySchema = z.object({
  password: z.string().optional(),
});

export type GetChatRequestQuery = z.infer<typeof GetChatRequestQuerySchema>;
export type GetChatRequestParams = z.infer<typeof GetChatRequestParamsSchema>;

// Request for deleting multiple chats
export const DeleteChatsRequestSchema = z.array(z.string());

export type DeleteChatsRequest = z.infer<typeof DeleteChatsRequestSchema>;

// Request for updating a chat
export const UpdateChatRequestSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  is_favorited: z.boolean().optional(),
});

export type UpdateChatRequest = z.infer<typeof UpdateChatRequestSchema>;

// Request for updating chat message feedback
export const UpdateChatMessageFeedbackRequestSchema = z.object({
  message_id: z.string(),
  feedback: z.enum(['negative']).nullable(),
});

export type UpdateChatMessageFeedbackRequest = z.infer<
  typeof UpdateChatMessageFeedbackRequestSchema
>;

// Request for duplicating a chat
export const DuplicateChatRequestSchema = z.object({
  id: z.string(),
  message_id: z.string().optional(),
});

export type DuplicateChatRequest = z.infer<typeof DuplicateChatRequestSchema>;

// Logs list request (same as chats list)
export const GetLogsListRequestSchema = GetChatsListRequestSchema;
export type GetLogsListRequest = z.infer<typeof GetLogsListRequestSchema>;

// Request for creating a CLI chat
export const CliChatCreateRequestSchema = z.object({
  prompt: z.string().describe('User prompt for the CLI chat'),
  chat_id: z.string().optional().describe('Optional existing chat ID to continue'),
  message_id: z.string().optional().describe('Optional message ID to continue from'),
});

export type CliChatCreateRequest = z.infer<typeof CliChatCreateRequestSchema>;
