import { ChatListItemSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities';
import { ChatWithMessagesSchema } from './chat.types';

// Response for getting a single chat
export const GetChatResponseSchema = ChatWithMessagesSchema;
export type GetChatResponse = z.infer<typeof GetChatResponseSchema>;

// Response for getting a list of chats
export const GetChatsListResponseSchema = z.array(ChatListItemSchema);
export type GetChatsListResponse = z.infer<typeof GetChatsListResponseSchema>;

// Response for getting a list of chats v2
export const GetChatsListResponseSchemaV2 = PaginatedResponseSchema(ChatListItemSchema);
export type GetChatsListResponseV2 = z.infer<typeof GetChatsListResponseSchemaV2>;

// Response for getting logs list (same as chats list)
export const GetLogsListResponseSchema = GetChatsListResponseSchema;
export type GetLogsListResponse = z.infer<typeof GetLogsListResponseSchema>;

// Response for updating a chat
export const UpdateChatResponseSchema = ChatWithMessagesSchema;
export type UpdateChatResponse = z.infer<typeof UpdateChatResponseSchema>;

// Response for updating chat message feedback
export const UpdateChatMessageFeedbackResponseSchema = ChatWithMessagesSchema;
export type UpdateChatMessageFeedbackResponse = z.infer<
  typeof UpdateChatMessageFeedbackResponseSchema
>;

// Response for duplicating a chat
export const DuplicateChatResponseSchema = ChatWithMessagesSchema;
export type DuplicateChatResponse = z.infer<typeof DuplicateChatResponseSchema>;

// Response for deleting chats (void)
export const DeleteChatsResponseSchema = z.void();
export type DeleteChatsResponse = z.infer<typeof DeleteChatsResponseSchema>;

export const ShareChatResponseSchema = ChatWithMessagesSchema;
export type ShareChatResponse = z.infer<typeof ShareChatResponseSchema>;

// Response for creating a CLI chat
export const CliChatCreateResponseSchema = ChatWithMessagesSchema;
export type CliChatCreateResponse = z.infer<typeof CliChatCreateResponseSchema>;
