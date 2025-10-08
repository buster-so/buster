import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';
import type { AssetPermissionRoleSchema } from '../share';
import { ShareConfigSchema } from '../share';
import { ChatMessageSchema } from './chat-message.types';

// Message metadata schema (mirrored from database package)
export const MessageMetadataSchema = z.object({
  shortcutIds: z.array(z.string().uuid()).nullable().optional(),
});

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

// Asset Permission Role enum (matching database enum)
export const ChatAssetTypeSchema = AssetTypeSchema.exclude(['chat', 'collection']);

// Message Analysis Mode enum (matching database enum)
export const MessageAnalysisModeSchema = z.enum(['auto', 'standard', 'investigation']);

// Main ChatWithMessages schema
export const ChatWithMessagesSchema = z.object({
  id: z.string(),
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
  screenshot_taken_at: z.string().nullable(),
  ...ShareConfigSchema.shape,
});

export const ChatCreateRequestSchema = z
  .object({
    prompt: z.string().optional(),
    chat_id: z.string().optional(),
    message_id: z.string().optional(),
    message_analysis_mode: MessageAnalysisModeSchema.optional(),
    asset_id: z.string().optional(),
    asset_type: ChatAssetTypeSchema.optional(),
    metadata: MessageMetadataSchema.optional(),
    // Legacy fields for backward compatibility
    metric_id: z.string().optional(),
    dashboard_id: z.string().optional(),
  })
  .refine((data) => !data.asset_id || data.asset_type, {
    message: 'asset_type must be provided when asset_id is specified',
    path: ['asset_type'],
  });

// Handler request schema (internal - without legacy fields)
export const ChatCreateHandlerRequestSchema = z.object({
  prompt: z.string().optional(),
  message_analysis_mode: MessageAnalysisModeSchema.optional(),
  chat_id: z.string().optional(),
  message_id: z.string().optional(),
  asset_id: z.string().optional(),
  asset_type: ChatAssetTypeSchema.optional(),
  metadata: MessageMetadataSchema.optional(),
});

// Cancel chat params schema
export const CancelChatParamsSchema = z.object({
  chat_id: z.string().uuid(),
});

export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;
export type CancelChatParams = z.infer<typeof CancelChatParamsSchema>;
export type ChatAssetType = z.infer<typeof ChatAssetTypeSchema>;
export type MessageAnalysisMode = z.infer<typeof MessageAnalysisModeSchema>;
