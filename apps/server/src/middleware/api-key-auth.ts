import { getApiKeyOrganization, validateApiKey } from '@buster/database/queries';
import { type ApiKeyContext, PublicChatError, PublicChatErrorCode } from '@buster/server-shared';
import type { Context, Next } from 'hono';

/**
 * Extracts Bearer token from Authorization header
 * @param headers The request headers
 * @returns The token if found, null otherwise
 */
export function extractBearerToken(headers: Headers): string | null {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Validates an API key token and returns the validation result
 * @param token The API key token to validate
 * @returns The API key context if valid
 * @throws PublicChatError if validation fails
 */
export async function validateApiKeyToken(token: string): Promise<ApiKeyContext> {
  // Validate the API key against the database
  const apiKey = await validateApiKey(token);

  if (!apiKey) {
    throw new PublicChatError(
      PublicChatErrorCode.INVALID_API_KEY,
      'Invalid or expired API key',
      401
    );
  }

  // Check if the organization has payment required flag
  const organization = await getApiKeyOrganization(apiKey.id);

  if (!organization) {
    throw new PublicChatError(
      PublicChatErrorCode.ORGANIZATION_ERROR,
      'Organization not found',
      403
    );
  }

  // Check payment status in production
  if (process.env.ENVIRONMENT === 'production' && organization.paymentRequired) {
    throw new PublicChatError(
      PublicChatErrorCode.PAYMENT_REQUIRED,
      'Payment required for this organization',
      402
    );
  }

  return apiKey;
}

/**
 * Creates API key authentication middleware for Hono
 * @returns Hono middleware handler
 */
export function createApiKeyAuthMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      // Extract Bearer token from Authorization header
      const token = extractBearerToken(c.req.raw.headers);

      if (!token) {
        return c.json(
          {
            error: 'Missing API key',
            code: PublicChatErrorCode.INVALID_API_KEY,
          },
          401
        );
      }

      // Validate the API key
      const apiKeyContext = await validateApiKeyToken(token);

      // Set the API key context for downstream handlers
      c.set('apiKey', apiKeyContext);

      // Continue to the next handler
      return await next();
    } catch (error) {
      // Handle PublicChatError specifically
      if (error instanceof PublicChatError) {
        // @ts-expect-error - statusCode is a number but Hono expects ContentfulStatusCode type
        return c.json({ error: error.message, code: error.code }, error.statusCode);
      }

      // Handle unexpected errors
      console.error('API key authentication error:', error);
      return c.json(
        {
          error: 'Authentication failed',
          code: PublicChatErrorCode.INTERNAL_ERROR,
        },
        500
      );
    }
  };
}

/**
 * Type guard to check if context has API key
 */
export function hasApiKey(c: Context): c is Context & { get(key: 'apiKey'): ApiKeyContext } {
  return c.get('apiKey') !== undefined;
}
