/**
 * Common utilities for storage providers
 */

/**
 * Sanitize storage key to prevent path traversal
 */
export function sanitizeKey(key: string): string {
  let sanitized = key;

  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');

  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');

  // Normalize multiple slashes to single slash
  sanitized = sanitized.replace(/\/+/g, '/');

  return sanitized;
}

/**
 * Convert string or Buffer to Buffer
 */
export function toBuffer(data: Buffer | string): Buffer {
  return typeof data === 'string' ? Buffer.from(data) : data;
}

/**
 * Parse error message from unknown error
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}
