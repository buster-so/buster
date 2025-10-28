import type { App, WebhookEventName } from '@buster/github';
import { createGitHubApp } from '@buster/github';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  handleInstallationWebhook,
  handleIssueCommentWebhook,
  handlePullRequestWebhook,
  handlePushWebhook,
} from '../api/v2/github/webhook-handlers';

let githubApp: App | undefined;

function getOrSetApp() {
  if (!githubApp) {
    if (!process.env.GH_WEBHOOK_SECRET) {
      throw new Error('GH_WEBHOOK_SECRET is not set');
    }
    githubApp = createGitHubApp();

    // Register webhook handlers once when the app is created
    githubApp.webhooks.on('pull_request.opened', async ({ payload, octokit }) => {
      await handlePullRequestWebhook(payload, octokit);
    });

    githubApp.webhooks.on('pull_request.reopened', async ({ payload, octokit }) => {
      await handlePullRequestWebhook(payload, octokit);
    });

    githubApp.webhooks.on('pull_request.synchronize', async ({ payload, octokit }) => {
      await handlePullRequestWebhook(payload, octokit);
    });

    githubApp.webhooks.on('issue_comment.created', async ({ octokit, payload }) => {
      await handleIssueCommentWebhook(payload, octokit);
    });

    githubApp.webhooks.on('installation', async ({ payload }) => {
      await handleInstallationWebhook(payload);
    });
    githubApp.webhooks.on('push', async ({ payload, octokit }) => {
      await handlePushWebhook(payload, octokit);
    });
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

      console.info('await githubApp.webhooks.verifyAndReceive');
      await githubApp.webhooks.verifyAndReceive({
        id,
        name,
        payload,
        signature,
      });

      return next();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error during Github webhook: ${error.message}`);
      } else {
        console.error(`Error during Github webhook: ${error}`);
      }

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(400, {
        message: `Github Webhook Failed`,
      });
    }
  };
}
