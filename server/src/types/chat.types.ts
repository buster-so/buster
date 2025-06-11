import { z } from 'zod';

const AssetType = z.enum(['metric_file', 'dashboard_file']);

// Asset Permission Role enum (matching database enum)
export const AssetPermissionRoleSchema = z.enum(['viewer', 'editor', 'owner']);

// Individual permission schema
export const BusterShareIndividualSchema = z.object({
  email: z.string().email(),
  role: AssetPermissionRoleSchema,
  name: z.string().optional(),
});

// Message role for chat messages
export const MessageRoleSchema = z.enum(['user', 'assistant']);

// Chat user message schema
export const ChatUserMessageSchema = z.object({
  request: z.string(),
  sender_id: z.string(),
  sender_name: z.string(),
  sender_avatar: z.string().optional(),
});

// File info schema for message attachments
export const FileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string().optional(),
  size: z.number().optional(),
});

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: MessageRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
  request_message: ChatUserMessageSchema.optional(),
  response_message: z.string().optional(),
  files: z.array(FileInfoSchema).optional(),
  reasoning_message: z.string().optional(),
  final_reasoning_message: z.string().optional(),
  feedback: z.enum(['positive', 'negative']).optional(),
  is_completed: z.boolean(),
});

// Main ChatWithMessages schema
export const ChatWithMessagesSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  is_favorited: z.boolean(),
  message_ids: z.array(z.string()),
  messages: z.record(z.string(), ChatMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string(),
  created_by_avatar: z.string().optional(),
  // Sharing fields
  individual_permissions: z.array(BusterShareIndividualSchema).optional(),
  publicly_accessible: z.boolean(),
  public_expiry_date: z.string().datetime().optional(),
  public_enabled_by: z.string().optional(),
  public_password: z.string().optional(),
  permission: AssetPermissionRoleSchema.optional(),
});

export const ChatCreateRequestSchema = z
  .object({
    prompt: z.string().optional(),
    chat_id: z.string().uuid().optional(),
    message_id: z.string().uuid().optional(),
    asset_id: z.string().uuid().optional(),
    asset_type: AssetType.optional(),
    // Legacy fields for backward compatibility
    metric_id: z.string().uuid().optional(),
    dashboard_id: z.string().uuid().optional(),
  })
  .refine((data) => !data.asset_id || data.asset_type, {
    message: 'asset_type must be provided when asset_id is specified',
    path: ['asset_type'],
  });

// Updated response schema to return full chat object
export const ChatCreateResponseSchema = ChatWithMessagesSchema;

// Handler request schema (internal - without legacy fields)
export const ChatCreateHandlerRequestSchema = z.object({
  prompt: z.string().optional(),
  chat_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  asset_type: AssetType.optional(),
});

// Infer types from schemas
export type AssetPermissionRole = z.infer<typeof AssetPermissionRoleSchema>;
export type BusterShareIndividual = z.infer<typeof BusterShareIndividualSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ChatUserMessage = z.infer<typeof ChatUserMessageSchema>;
export type FileInfo = z.infer<typeof FileInfoSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateResponse = z.infer<typeof ChatCreateResponseSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;
