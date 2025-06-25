import { z } from 'zod';
import { type SlackOAuthConfig, SlackOAuthConfigSchema } from '../types';
import { SlackIntegrationError } from '../types/errors';

/**
 * Parse OAuth callback parameters
 */
export const OAuthCallbackParamsSchema = z.object({
  code: z.string().optional(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackParams = z.infer<typeof OAuthCallbackParamsSchema>;

/**
 * Handle OAuth callback errors
 */
export function handleOAuthError(params: OAuthCallbackParams): SlackIntegrationError | null {
  if (!params.error) {
    return null;
  }

  switch (params.error) {
    case 'access_denied':
      return new SlackIntegrationError(
        'OAUTH_ACCESS_DENIED',
        'User denied the authorization request'
      );

    case 'invalid_scope':
      return new SlackIntegrationError('OAUTH_TOKEN_EXCHANGE_FAILED', 'Invalid scope requested');

    default:
      return new SlackIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        params.error_description || `OAuth error: ${params.error}`
      );
  }
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(config: unknown): SlackOAuthConfig {
  const result = SlackOAuthConfigSchema.safeParse(config);

  if (!result.success) {
    throw new SlackIntegrationError('UNKNOWN_ERROR', 'Invalid OAuth configuration', false, {
      errors: result.error.flatten(),
    });
  }

  return result.data;
}
