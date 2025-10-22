import {
  getApiKeyForInstallationId,
  getGithubIntegrationByInstallationId,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { App, WebhookEventName } from '@buster/github';
import { AuthDetailsAppInstallationResponseSchema, createGitHubApp } from '@buster/github';
import { runDocsAgentAsync } from '@buster/sandbox';
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

      // Check if the sender is a bot - skip processing if so
      if (payload.comment?.user?.type === 'Bot') {
        console.info(`Ignoring comment from bot ${username} in ${owner}/${repo}#${issue_number}`);
        return;
      }

      if (commentBody.includes('@buster-agent')) {
        if (payload.issue.pull_request) {
          const responseBody = 'Kicking off buster agent with your request!';
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
          await runDocsAgentAsync({
            installationToken: authDetails.token,
            repoUrl: payload.repository.html_url,
            branch: branch,
            prompt: commentBody,
            apiKey: apiKey.key,
            organizationId: apiKey.organizationId,
          });
        }
      }
    });

    githubApp.webhooks.on('installation', async ({ payload }) => {
      // Get existing integration once for all actions
      const existing = await getGithubIntegrationByInstallationId(
        payload.installation.id.toString()
      );

      if (!existing) {
        // Handle cases where no integration exists
        if (payload.action === 'created') {
          console.error(
            `Installation failed for ${payload.installation.id} because it was not installed from our link and we don't have organization and user info required`
          );
        } else {
          console.warn(
            `Installation ${payload.action} but no integration found for installation id ${payload.installation.id}`
          );
        }
        return;
      }

      // Prepare update data based on action
      let updateData: {
        githubOrgName?: string;
        status?: 'pending' | 'active' | 'suspended' | 'revoked';
        permissions?: Record<string, string>;
        deletedAt?: string;
      } = {};
      let actionDescription = '';

      switch (payload.action) {
        case 'created': {
          let orgName = 'Unknown Github User';
          if (payload.installation.account) {
            orgName =
              'login' in payload.installation.account
                ? payload.installation.account.login // Github User
                : payload.installation.account.name; // Github Enterprise
          }
          updateData = {
            githubOrgName: orgName,
            status: 'active',
            permissions: payload.installation.permissions,
          };
          actionDescription = 'created';
          break;
        }
        case 'deleted': {
          updateData = {
            status: 'revoked',
            deletedAt: new Date().toISOString(),
          };
          actionDescription = 'deleted';
          break;
        }
        case 'suspend': {
          updateData = {
            status: 'suspended',
          };
          actionDescription = 'suspended';
          break;
        }
        case 'unsuspend': {
          updateData = {
            status: 'active',
          };
          actionDescription = 'unsuspended';
          break;
        }
        case 'new_permissions_accepted': {
          updateData = {
            permissions: payload.installation.permissions,
          };
          actionDescription = 'permissions updated';
          break;
        }
      }

      // Perform the update
      const updated = await updateGithubIntegration(existing.id, updateData);

      if (updated) {
        console.info(
          `Installation ${actionDescription} for installation id ${payload.installation.id} successfully`
        );
      } else {
        console.error(
          `Failed to ${payload.action} GitHub integration for installation id ${payload.installation.id}`
        );
      }
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
