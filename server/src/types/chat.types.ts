import { z } from 'zod';

const AssetType = z.enum(['metric_file', 'dashboard_file']);

export const ChatCreateRequestSchema = z.object({
  prompt: z.string().optional(),
  chat_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  asset_type: AssetType.optional(),
  // Legacy fields for backward compatibility
  metric_id: z.string().uuid().optional(),
  dashboard_id: z.string().uuid().optional(),
}).refine(
  (data) => !data.asset_id || data.asset_type,
  {
    message: "asset_type must be provided when asset_id is specified",
    path: ["asset_type"]
  }
);

export const ChatCreateResponseSchema = z.object({
  message_id: z.string(),
});

// Handler request schema (internal)
export const ChatCreateHandlerRequestSchema = z.object({
  prompt: z.string().optional(),
  chat_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  asset_type: AssetType.optional(),
  metric_id: z.string().uuid().optional(),
  dashboard_id: z.string().uuid().optional(),
});

// Infer types from schemas
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateResponse = z.infer<typeof ChatCreateResponseSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;