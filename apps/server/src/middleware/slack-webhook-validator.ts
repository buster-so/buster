import {
  handleUrlVerification,
  parseSlackWebhookPayload,
  type SlackWebhookPayload,
  verifySlackRequest,
} from '@buster/slack';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Middleware to validate Slack webhook requests
 * Combines signature verification and payload parsing
 */
export function slackWebhookValidator(): MiddlewareHandler {
  return async (c: Context, next) => {
    console.info('Slack webhook received');
    try {
      // Get the raw body for signature verification
      const rawBody = await c.req.text();
      console.info('Raw body length:', rawBody.length);

      // Get headers for verification
      const headers: Record<string, string | string[] | undefined> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Get signing secret from environment
      const signingSecret = process.env.SLACK_SIGNING_SECRET;
      if (!signingSecret) {
        throw new HTTPException(500, {
          message: 'SLACK_SIGNING_SECRET not configured',
        });
      }

      // Verify the request signature
      verifySlackRequest(rawBody, headers, signingSecret);

      // Parse the request body
      const parsedBody = JSON.parse(rawBody);

      // Check if this is a URL verification request
      const challenge = handleUrlVerification(parsedBody);
      if (challenge) {
        // Set the challenge in context for the handler to use
        c.set('slackChallenge', challenge);
        c.set('slackPayload', null);
        return next();
      }

      // Parse and validate the webhook payload
      const payload = parseSlackWebhookPayload(parsedBody);

      // Set the validated payload in context
      c.set('slackPayload', payload);
      c.set('slackChallenge', null);

      return next();
    } catch (error) {
      // For Slack webhooks, we should always return 200 OK
      // to prevent retries, but log the error
      console.error('Slack webhook validation error:', error);

      // Return 200 OK with success: false
      return c.json({ success: false });
    }
  };
}

// Type extensions for Hono context
declare module 'hono' {
  interface ContextVariableMap {
    slackPayload: SlackWebhookPayload | null;
    slackChallenge: string | null;
  }
}
