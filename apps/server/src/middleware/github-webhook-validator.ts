import { InstallationCallbackSchema, verifyGitHubWebhookSignature } from '@buster/github';
import { getSecret } from '@buster/secrets';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Middleware to validate GitHub webhook requests
 * Verifies signature and parses payload
 */
export function githubWebhookValidator(): MiddlewareHandler {
  return async (c: Context, next) => {
    console.info('GitHub webhook received');

    try {
      // Get the raw body for signature verification
      const rawBody = await c.req.text();
      console.info('Raw body length:', rawBody.length);

      // Get signature header
      const signature = c.req.header('X-Hub-Signature-256');
      if (!signature) {
        throw new HTTPException(401, {
          message: 'Missing X-Hub-Signature-256 header',
        });
      }

      // Get webhook secret from secrets
      const _webhookSecret = await getSecret('GITHUB_WEBHOOK_SECRET').catch(() => {
        throw new HTTPException(500, {
          message: 'GITHUB_WEBHOOK_SECRET not configured',
        });
      });

      // Verify the signature
      const isValid = verifyGitHubWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new HTTPException(401, {
          message: 'Invalid webhook signature',
        });
      }

      // Parse and validate the payload
      const parsedBody = JSON.parse(rawBody);
      const validatedPayload = InstallationCallbackSchema.parse(parsedBody);

      // Set the validated payload in context
      c.set('githubPayload', validatedPayload);

      console.info(
        `GitHub webhook validated: action=${validatedPayload.action}, installationId=${validatedPayload.installation.id}`
      );

      return next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('Failed to validate GitHub webhook:', error);
      throw new HTTPException(400, {
        message: 'Invalid webhook payload',
      });
    }
  };
}
