import { z } from 'zod';
import { GitHubIntegrationError } from '../types/errors';

export function generateSecureState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new GitHubIntegrationError(
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      `${errorMessage}: ${result.error.message}`,
      false,
      { validationErrors: result.error.errors }
    );
  }
  return result.data;
}
