import type { z } from 'zod';
import { SlackIntegrationError } from '../types/errors';

/**
 * Safely parse data with Zod schema
 * @param schema The Zod schema to use
 * @param data The data to parse
 * @param errorMessage Custom error message
 * @returns Parsed data
 * @throws SlackIntegrationError if validation fails
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new SlackIntegrationError('UNKNOWN_ERROR', errorMessage, false, {
      zodError: result.error.flatten(),
    });
  }

  return result.data;
}

/**
 * Generate secure random state for OAuth
 * @returns Cryptographically secure random string
 */
export function generateSecureState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if OAuth state has expired
 * @param expiresAt Unix timestamp
 * @returns true if expired
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}
