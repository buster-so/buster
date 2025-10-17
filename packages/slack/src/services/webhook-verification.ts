import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { SlackIntegrationError } from '../types/errors';
import {
  type SlackRequestHeaders,
  type SlackWebhookPayload,
  slackRequestHeadersSchema,
  slackWebhookPayloadSchema,
  type UrlVerification,
  urlVerificationSchema,
} from '../types/webhooks';

/**
 * Maximum age for a valid request (5 minutes in seconds)
 */
const MAX_REQUEST_AGE_SECONDS = 300;

/**
 * Verifies that a request is from Slack by checking the signature
 * @param rawBody - The raw request body as a string
 * @param headers - The request headers containing Slack signature and timestamp
 * @param signingSecret - Your app's signing secret from Slack
 * @returns true if the request is valid, throws an error otherwise
 */
export function verifySlackRequest(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  signingSecret: string
): boolean {
  // Normalize headers to lowercase
  const normalizedHeaders: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalizedHeaders[key.toLowerCase()] = value;
  }

  // Extract and validate required headers
  const timestamp = normalizedHeaders['x-slack-request-timestamp'];
  const signature = normalizedHeaders['x-slack-signature'];

  if (!timestamp || !signature) {
    throw new SlackIntegrationError('VERIFICATION_FAILED', 'Missing required Slack headers');
  }

  // Ensure headers are strings
  const timestampStr = Array.isArray(timestamp) ? timestamp[0] : timestamp;
  const signatureStr = Array.isArray(signature) ? signature[0] : signature;

  if (!timestampStr || !signatureStr) {
    throw new SlackIntegrationError('VERIFICATION_FAILED', 'Missing required Slack headers');
  }

  // Validate headers with schema
  try {
    slackRequestHeadersSchema.parse({
      'x-slack-request-timestamp': timestampStr,
      'x-slack-signature': signatureStr,
    });
  } catch {
    throw new SlackIntegrationError('VERIFICATION_FAILED', 'Invalid Slack headers format');
  }

  // Check timestamp to prevent replay attacks
  const requestTimestamp = Number.parseInt(timestampStr, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTimestamp - requestTimestamp) > MAX_REQUEST_AGE_SECONDS) {
    throw new SlackIntegrationError('VERIFICATION_FAILED', 'Request timestamp is too old');
  }

  // Create the base string for signature
  const baseString = `v0:${timestampStr}:${rawBody}`;

  // Calculate expected signature
  const hmac = createHmac('sha256', signingSecret);
  hmac.update(baseString, 'utf8');
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  // Compare signatures
  if (expectedSignature !== signatureStr) {
    throw new SlackIntegrationError('VERIFICATION_FAILED', 'Invalid request signature');
  }

  return true;
}

/**
 * Handles URL verification challenges from Slack
 * @param body - The request body
 * @returns The challenge value if it's a URL verification, null otherwise
 */
export function handleUrlVerification(body: unknown): string | null {
  try {
    const parsed = urlVerificationSchema.parse(body);
    return parsed.challenge;
  } catch {
    // Not a URL verification request
    return null;
  }
}

/**
 * Parses and validates a Slack webhook payload
 * @param body - The request body
 * @returns The parsed and validated webhook payload
 */
export function parseSlackWebhookPayload(body: unknown): SlackWebhookPayload {
  try {
    return slackWebhookPayloadSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SlackIntegrationError(
        'INVALID_PAYLOAD',
        `Invalid webhook payload: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw new SlackIntegrationError('INVALID_PAYLOAD', 'Failed to parse webhook payload');
  }
}

/**
 * Helper to get the raw body string from various request formats
 * @param body - The request body in various formats
 * @returns The raw body as a string
 */
export function getRawBody(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }
  if (typeof body === 'object' && body !== null) {
    return JSON.stringify(body);
  }
  return '';
}
