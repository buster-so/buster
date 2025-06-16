import { z } from 'zod';

/**
 * Error codes for chat operations
 */
export const ChatErrorCode = {
  // Validation errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_ORGANIZATION: 'MISSING_ORGANIZATION',

  // Permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Resource errors
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',

  // External service errors
  TRIGGER_ERROR: 'TRIGGER_ERROR',

  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ChatErrorCode = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

/**
 * Structured error response schema
 */
export const ChatErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ChatErrorResponse = z.infer<typeof ChatErrorResponseSchema>;

/**
 * Chat error class for consistent error handling
 */
export class ChatError extends Error {
  constructor(
    public code: ChatErrorCode,
    public override message: string,
    public statusCode: 500 | 400 | 401 | 403 | 404 | 409 | 500 = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChatError';
  }

  toResponse(): ChatErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
