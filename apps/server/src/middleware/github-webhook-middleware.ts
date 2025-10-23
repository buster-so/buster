import {
  getApiKeyForInstallationId,
  getGithubIntegrationByInstallationId,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { App, WebhookEventName } from '@buster/github';
import { createGitHubApp } from '@buster/github';
import { AuthDetailsAppInstallationResponseSchema } from '@buster/server-shared';
import type { GithubContext } from '@buster/sandbox';
import { runDocsAgentAsync } from '@buster/sandbox';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { handleInstallationCallback } from '../api/v2/github/services';

let githubApp: App | undefined;

const GithubAppNameSchema = z.object({
  GH_APP_NAME: z.string(),
});

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
      const repoUrl = payload.repository.html_url;
      const issueNumber = payload.issue.number;
      const username = payload.comment?.user?.login;
      const commentBody = payload.comment.body;
      const env = GithubAppNameSchema.parse(process.env);
      const appMention = `@${env.GH_APP_NAME}`;
      console.info(`Issue comment created by ${username} in ${owner}/${repo}#${issueNumber}`);

      // Check if the sender is a bot - skip processing if so
      if (payload.comment?.user?.type === 'Bot') {
        console.info(`Ignoring comment from bot ${username} in ${owner}/${repo}#${issueNumber}`);
        return;
      }

      if (commentBody.includes(appMention)) {
        if (payload.issue.pull_request) {
          const responseBody = 'Kicking off buster agent with your request!';
          octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: responseBody,
          });
          const pull_request = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: issueNumber,
          });

          const headBranch = pull_request.data.head.ref;
          const baseBranch = pull_request.data.base.ref;

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

          const context: GithubContext = {
            action: 'comment',
            prNumber: issueNumber.toString(),
            repo,
            repo_url: repoUrl,
            head_branch: headBranch,
            base_branch: baseBranch,
          };

          await runDocsAgentAsync({
            installationToken: authDetails.token,
            repoUrl: payload.repository.html_url,
            branch: headBranch,
            prompt: commentBody,
            apiKey: apiKey.key,
            organizationId: apiKey.organizationId,
            context,
          });
        }
      }
    });

    githubApp.webhooks.on('installation', async ({payload}) => {
      await handleInstallationCallback(payload);
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
