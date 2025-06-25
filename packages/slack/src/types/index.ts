import { z } from 'zod';

// Integration result schema - returned after successful OAuth
export const SlackIntegrationResultSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  teamDomain: z.string().optional(),
  botUserId: z.string(),
  scope: z.string(),
  installerUserId: z.string(),
  enterpriseId: z.string().optional(),
  accessToken: z.string(),
});

export type SlackIntegrationResult = z.infer<typeof SlackIntegrationResultSchema>;

// OAuth state for CSRF protection
export const SlackOAuthStateSchema = z.object({
  state: z.string(),
  expiresAt: z.number(), // Unix timestamp
  metadata: z.record(z.unknown()).optional(), // For app-specific data
});

export type SlackOAuthState = z.infer<typeof SlackOAuthStateSchema>;

// OAuth Response from Slack API
export const SlackOAuthResponseSchema = z.object({
  ok: z.boolean(),
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  bot_user_id: z.string(),
  app_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    domain: z.string().optional(),
  }),
  enterprise: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  authed_user: z.object({
    id: z.string(),
    scope: z.string(),
    access_token: z.string().optional(),
    token_type: z.string().optional(),
  }),
  is_enterprise_install: z.boolean().optional(),
});

export type SlackOAuthResponse = z.infer<typeof SlackOAuthResponseSchema>;

// OAuth configuration
export const SlackOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).default(['channels:read', 'chat:write', 'chat:write.public']),
});

export type SlackOAuthConfig = z.infer<typeof SlackOAuthConfigSchema>;

// Import block schemas
import { SlackAttachmentSchema, SlackBlockSchema } from './blocks';

// Message Types
export const SlackMessageSchema = z.object({
  text: z.string().optional(),
  blocks: z.array(SlackBlockSchema).optional(),
  attachments: z.array(SlackAttachmentSchema).optional(),
  thread_ts: z.string().optional(),
  unfurl_links: z.boolean().optional(),
  unfurl_media: z.boolean().optional(),
});

export type SlackMessage = z.infer<typeof SlackMessageSchema>;

// Channel Information
export const SlackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean(),
  is_archived: z.boolean(),
  is_member: z.boolean().optional(),
});

export type SlackChannel = z.infer<typeof SlackChannelSchema>;

// Send message result
export const SendMessageResultSchema = z.object({
  success: z.boolean(),
  messageTs: z.string().optional(),
  channelId: z.string().optional(),
  error: z.string().optional(),
});

export type SendMessageResult = z.infer<typeof SendMessageResultSchema>;
