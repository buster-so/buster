import { z } from 'zod';

/**
 * Validates that a string is a PEM-encoded private key
 *
 * Checks for standard PEM format markers including:
 * - BEGIN/END PRIVATE KEY (PKCS8 format)
 * - BEGIN/END RSA PRIVATE KEY (traditional format)
 * - BEGIN/END ENCRYPTED PRIVATE KEY (encrypted PKCS8)
 *
 * @param key - The private key string to validate
 * @returns true if the key appears to be in valid PEM format
 *
 * @example
 * ```typescript
 * const key = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';
 * validatePrivateKey(key); // true
 *
 * validatePrivateKey('not-a-key'); // false
 * ```
 */
export function validatePrivateKey(key: string): boolean {
  // Check for PEM format markers
  // Supports: PRIVATE KEY, RSA PRIVATE KEY, ENCRYPTED PRIVATE KEY
  // Ensures BEGIN and END markers match
  const trimmedKey = key.trim();
  const pemRegex =
    /^-----BEGIN (RSA |ENCRYPTED )?PRIVATE KEY-----[\s\S]+-----END (RSA |ENCRYPTED )?PRIVATE KEY-----$/;

  // First check basic format
  if (!pemRegex.test(trimmedKey)) {
    return false;
  }

  // Extract the modifiers from BEGIN and END markers to ensure they match
  const beginMatch = trimmedKey.match(/^-----BEGIN (RSA |ENCRYPTED )?PRIVATE KEY-----/);
  const endMatch = trimmedKey.match(/-----END (RSA |ENCRYPTED )?PRIVATE KEY-----$/);

  if (!beginMatch || !endMatch) {
    return false;
  }

  // Ensure the modifiers match (both undefined or both the same string)
  const beginModifier = beginMatch[1] || '';
  const endModifier = endMatch[1] || '';

  return beginModifier === endModifier;
}

/**
 * Zod schema refinement for private key validation
 * Use this in credential schemas to ensure private keys are in valid PEM format
 *
 * @example
 * ```typescript
 * const KeyPairCredentialsSchema = z.object({
 *   private_key: PrivateKeySchema,
 *   passphrase: z.string().optional()
 * });
 * ```
 */
export const PrivateKeySchema = z
  .string()
  .min(1, 'Private key is required')
  .refine(validatePrivateKey, {
    message:
      'Private key must be in PEM format (-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----)',
  });
