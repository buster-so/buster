import { getApiKeyForInstallationId } from '@buster/database/queries';
import type { IssueCommentCreatedWebhookEvent, Octokit } from '@buster/github';
import type { GithubContext } from '@buster/sandbox';
import { runDocsAgentAsync } from '@buster/sandbox';
import { AuthDetailsAppInstallationResponseSchema } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

const GithubAppNameSchema = z.object({
  GH_APP_NAME: z.string(),
});

/**
 * Handle GitHub App issue_comment.created webhook callback
 * Processes comments on pull requests and kicks off the buster agent when mentioned
 */
export async function handleIssueCommentWebhook(
  payload: IssueCommentCreatedWebhookEvent,
  octokit: Octokit
): Promise<void> {
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
}
