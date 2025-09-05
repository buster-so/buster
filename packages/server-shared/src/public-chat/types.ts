import { z } from 'zod';

// Request schema for public chat API
export const PublicChatRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  prompt: z.string().min(1, 'Prompt cannot be empty'),
});

export type PublicChatRequest = z.infer<typeof PublicChatRequestSchema>;

// SSE event types
export const PublicChatStatusEventSchema = z.object({
  type: z.literal('status'),
  message: z.string(),
  link: z.string(),
});

export const PublicChatResponseEventSchema = z.object({
  type: z.literal('response'),
  message: z.string(),
  link: z.string(),
  is_finished: z.literal(true),
});

export const PublicChatErrorEventSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
});

// Union of all event types
export const PublicChatEventSchema = z.discriminatedUnion('type', [
  PublicChatStatusEventSchema,
  PublicChatResponseEventSchema,
  PublicChatErrorEventSchema,
]);

export type PublicChatStatusEvent = z.infer<typeof PublicChatStatusEventSchema>;
export type PublicChatResponseEvent = z.infer<typeof PublicChatResponseEventSchema>;
export type PublicChatErrorEvent = z.infer<typeof PublicChatErrorEventSchema>;
export type PublicChatEvent = z.infer<typeof PublicChatEventSchema>;

// API Key validation result
export interface ApiKeyContext {
  id: string;
  ownerId: string;
  organizationId: string;
  key: string;
}

// Error codes for public chat API
export enum PublicChatErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ORGANIZATION_ERROR = 'ORGANIZATION_ERROR',
  CHAT_CREATION_FAILED = 'CHAT_CREATION_FAILED',
  MESSAGE_PROCESSING_FAILED = 'MESSAGE_PROCESSING_FAILED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Custom error class for public chat API
export class PublicChatError extends Error {
  constructor(
    public code: PublicChatErrorCode,
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = 'PublicChatError';
  }
}
