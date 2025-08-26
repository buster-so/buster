import { createHmac, timingSafeEqual } from 'node:crypto';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { getGitHubAppCredentials } from '../client/app';

/**
 * Verify a GitHub webhook signature
 *
 * @param payload The raw request body as a string
 * @param signature The signature from the X-Hub-Signature-256 header
 * @returns true if the signature is valid, false otherwise
 */
export async function verifyGitHubWebhookSignature(
  payload: string,
  signature: string | undefined
): Promise<boolean> {
  if (!signature) {
    console.error('Missing GitHub webhook signature header');
    return false;
  }

  try {
    const { webhookSecret } = await getGitHubAppCredentials();

    // GitHub sends the signature in the format "sha256=<signature>"
    if (!signature.startsWith('sha256=')) {
      console.error('Invalid GitHub webhook signature format');
      return false;
    }

    // Extract the actual signature hash
    const signatureHash = signature.slice('sha256='.length);

    // Compute the expected signature
    const expectedSignature = createHmac('sha256', webhookSecret).update(payload).digest('hex');

    // Use constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signatureHash, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    // Both buffers must be the same length for timingSafeEqual
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying GitHub webhook signature:', error);
    return false;
  }
}

/**
 * Extract the signature from GitHub webhook headers
 *
 * @param headers The request headers
 * @returns The signature string or undefined if not found
 */
export function extractGitHubWebhookSignature(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  // GitHub sends the signature in the X-Hub-Signature-256 header
  const signature = headers['x-hub-signature-256'];

  if (Array.isArray(signature)) {
    return signature[0];
  }

  return signature;
}

/**
 * Verify a GitHub webhook request
 * Combines signature extraction and verification
 *
 * @param payload The raw request body as a string
 * @param headers The request headers
 * @throws Error if the signature is invalid
 */
export async function verifyGitHubWebhook(
  payload: string,
  headers: Record<string, string | string[] | undefined>
): Promise<void> {
  const signature = extractGitHubWebhookSignature(headers);

  if (!signature) {
    throw createGitHubError(
      GitHubErrorCode.WEBHOOK_VERIFICATION_FAILED,
      'Missing X-Hub-Signature-256 header'
    );
  }

  const isValid = await verifyGitHubWebhookSignature(payload, signature);

  if (!isValid) {
    throw createGitHubError(
      GitHubErrorCode.WEBHOOK_VERIFICATION_FAILED,
      'Invalid webhook signature'
    );
  }
}

/**
 * Create a GitHub operation error
 */
function createGitHubError(code: GitHubErrorCode, message: string): Error {
  const error = new Error(message) as Error & { code: GitHubErrorCode };
  error.code = code;
  return error;
}
