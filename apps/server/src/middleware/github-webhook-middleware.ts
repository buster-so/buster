import { getApiKeyForInstallationId } from '@buster/database/queries';
import { AuthDetailsAppInstallationResponseSchema, createGitHubApp } from '@buster/github';
import type { App, WebhookEventName } from '@buster/github';
import { runDocsAgent } from '@buster/sandbox';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

let githubApp: App | undefined;

function getOrSetApp() {
  if (!githubApp) {
    if (!process.env.GH_WEBHOOK_SECRET) {
      throw new Error('GH_WEBHOOK_SECRET is not set');
    }
    githubApp = createGitHubApp();

    // Register webhook handlers once when the app is created
    githubApp.webhooks.on('pull_request.opened', ({ payload }) => {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const issue_number = payload.pull_request.number;
      const username = payload.pull_request.user.login;
      console.info(`Pull request opened by ${username} in ${owner}/${repo}#${issue_number}`);
    });

    githubApp.webhooks.on('pull_request.reopened', async ({ payload }) => {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const issue_number = payload.pull_request.number;
      const username = payload.pull_request.user.login;

      console.info(`Pull request reopened by ${username} in ${owner}/${repo}#${issue_number}`);
    });

    githubApp.webhooks.on('issue_comment.created', async ({ octokit, payload }) => {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const issue_number = payload.issue.number;
      const username = payload.comment?.user?.login;
      const commentBody = payload.comment.body;
      console.info(`Issue comment created by ${username} in ${owner}/${repo}#${issue_number}`);

      if (commentBody.startsWith('Buster!')) {
        if (payload.issue.pull_request) {
          const responseBody = 'I will kick off the docs agent now!';
          octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body: responseBody,
          });
          const pull_request = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: issue_number,
          });
          const branch = pull_request.data.head.ref;
          const authResult = await octokit.auth({ type: 'installation' });
          const result = AuthDetailsAppInstallationResponseSchema.safeParse(authResult);
          if (!result.success) {
            throw new HTTPException(400, {
              message: 'Invalid auth details',
            });
          }
          const authDetails = result.data;

          const apiKey = await getApiKeyForInstallationId(authDetails.installationId);
          if (!apiKey) {
            throw new HTTPException(400, {
              message: 'No API key found for installation id',
            });
          }
          await runDocsAgent({
            installationToken: authDetails.token,
            repoUrl: payload.repository.html_url,
            branch: branch,
            prompt: commentBody,
            apiKey: apiKey,
          });
        }
      }
    });

    githubApp.webhooks.on('installation', ({ payload }) => {
      console.info(
        `Installation event received: ${payload.action} for installation id ${payload.installation.id}`
      );
    });
  }
  return githubApp;
}

/**
 * Middleware to validate GitHub webhook requests
 * Verifies signature and parses payload
 */
export function githubWebhookMiddleware(): MiddlewareHandler {
  console.info('webhook middleware was called');
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
