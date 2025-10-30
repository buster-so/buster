import { z } from 'zod';
import type { Credentials } from './requests';

/**
 * Redacted value used to replace sensitive credential fields
 */
export const REDACTED = '*****' as const;

/**
 * Sanitized credentials type where sensitive fields are redacted
 * This ensures type safety when returning credentials through API responses
 *
 * Note: The type allows both the REDACTED constant and string type to support
 * test fixtures and story files while maintaining runtime validation
 */
export type SanitizedCredentials = Credentials & {
  // Override sensitive fields to be redacted strings
  password?: string;
  private_key?: string;
  private_key_passphrase?: string;
  service_account_key?: string | Record<string, unknown>;
  token?: string;
};

/**
 * Schema for sanitized credentials - validates that sensitive fields are redacted
 */
export const SanitizedCredentialsSchema = z
  .custom<SanitizedCredentials>((data) => {
    // Basic type check
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const creds = data as Record<string, unknown>;

    // Check that sensitive fields are either missing or redacted
    const sensitiveFields = [
      'password',
      'private_key',
      'private_key_passphrase',
      'service_account_key',
      'token',
    ];

    for (const field of sensitiveFields) {
      if (field in creds && creds[field] !== REDACTED && creds[field] !== undefined) {
        return false;
      }
    }

    return true;
  })
  .describe('Sanitized credentials with sensitive fields redacted');

/**
 * Sanitizes credentials by redacting sensitive fields
 *
 * This function creates a deep copy of the credentials object and replaces
 * sensitive fields with ***** to prevent exposure through API responses.
 *
 * Sensitive fields that are redacted:
 * - password (all database types)
 * - private_key (Snowflake key-pair auth)
 * - private_key_passphrase (Snowflake key-pair auth)
 * - service_account_key (BigQuery)
 * - token (MotherDuck)
 *
 * @param credentials - The credentials object to sanitize
 * @returns A new credentials object with sensitive fields redacted
 *
 * @example
 * ```typescript
 * const creds = {
 *   type: 'snowflake',
 *   auth_method: 'password',
 *   account_id: 'ABC123',
 *   username: 'john.doe',
 *   password: 'super-secret-password'
 * };
 *
 * const sanitized = sanitizeCredentials(creds);
 * // Result:
 * // {
 * //   type: 'snowflake',
 * //   auth_method: 'password',
 * //   account_id: 'ABC123',
 * //   username: 'john.doe',
 * //   password: '*****'
 * // }
 * ```
 */
export function sanitizeCredentials(credentials: Credentials): SanitizedCredentials {
  // Create a shallow copy to avoid mutating the original
  const sanitized = { ...credentials } as Record<string, unknown>;

  // Redact password (PostgreSQL, MySQL, SQL Server, Redshift, Snowflake password auth)
  if ('password' in sanitized && sanitized.password) {
    sanitized.password = REDACTED;
  }

  // Redact private key and passphrase (Snowflake key-pair auth)
  if ('private_key' in sanitized && sanitized.private_key) {
    sanitized.private_key = REDACTED;
  }

  if ('private_key_passphrase' in sanitized && sanitized.private_key_passphrase) {
    sanitized.private_key_passphrase = REDACTED;
  }

  // Redact service account key (BigQuery)
  if ('service_account_key' in sanitized && sanitized.service_account_key) {
    sanitized.service_account_key = REDACTED;
  }

  // Redact token (MotherDuck)
  if ('token' in sanitized && sanitized.token) {
    sanitized.token = REDACTED;
  }

  return sanitized as SanitizedCredentials;
}
