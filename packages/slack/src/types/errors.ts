import { z } from 'zod';

export const SlackErrorCodeSchema = z.enum([
  'OAUTH_ACCESS_DENIED',
  'OAUTH_INVALID_STATE',
  'OAUTH_TOKEN_EXCHANGE_FAILED',
  'INVALID_TOKEN',
  'CHANNEL_NOT_FOUND',
  'NOT_IN_CHANNEL',
  'RATE_LIMITED',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
]);

export type SlackErrorCode = z.infer<typeof SlackErrorCodeSchema>;

export const SlackErrorSchema = z.object({
  code: SlackErrorCodeSchema,
  message: z.string(),
  retryable: z.boolean().default(false),
  details: z.record(z.unknown()).optional(),
});

export type SlackError = z.infer<typeof SlackErrorSchema>;

export class SlackIntegrationError extends Error {
  constructor(
    public readonly code: SlackErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SlackIntegrationError';
  }
}
