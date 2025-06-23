import { z } from 'zod';
import { ChatMessageSchema } from './chat-message.types';

const AssetType = z.enum(['metric_file', 'dashboard_file']);

// Asset Permission Role enum (matching database enum)
export const AssetPermissionRoleSchema = z.enum(['viewer', 'editor', 'owner']);

// Individual permission schema
export const BusterShareIndividualSchema = z.object({
  email: z.string().email(),
  role: AssetPermissionRoleSchema,
  name: z.string().optional(),
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
  created_by_avatar: z.string().nullable(),
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
export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateResponse = z.infer<typeof ChatCreateResponseSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;
