import {
  InstallationCallbackSchema,
  createGitHubApp,
  verifyGitHubWebhookSignature,
} from '@buster/github';
import type { WebhookEventName } from '@octokit/webhooks/types';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { App } from 'octokit';

let githubApp: App | undefined;

function getOrSetApp() {
  if (!githubApp) {
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      throw new Error('GITHUB_WEBHOOK_SECRET is not set');
    }
    githubApp = createGitHubApp();
  }
  return githubApp;
}

/**
 * Middleware to validate GitHub webhook requests
 * Verifies signature and parses payload
 */
export function githubWebhookMiddleware(): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      const githubApp = getOrSetApp();
      c.set('githubApp', githubApp);

      const id = c.req.header('x-github-delivery');
      const signature = c.req.header('x-hub-signature-256');
      const name = c.req.header('x-github-event') as WebhookEventName;
      const payload = await c.req.text();

      if (!id || !signature || !name) {
        throw new HTTPException(403, {
          message: 'Invalid webhook request',
        });
      }

      await next();

      await githubApp.webhooks.verifyAndReceive({
        id,
        name,
        payload,
        signature,
      });

      return c.text('Webhook received & verified', 201);
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
