import { getAgentTasksForEvent, getApiKeyForInstallationId } from '@buster/database/queries';
import type { AgentEventTrigger, AgentName } from '@buster/database/schema-types';
import type { Octokit, PullRequestWebhookEvent } from '@buster/github';
import { type GithubContext, runDocsAgentAsync } from '@buster/sandbox';
import { AuthDetailsAppInstallationResponseSchema } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handle GitHub App pull_request webhook callback
 * Processes pull request events (opened, reopened, synchronize)
 */
export async function handlePullRequestWebhook(
  payload: PullRequestWebhookEvent,
  octokit: Octokit
): Promise<void> {
  const repo = payload.repository.full_name;
  const repoUrl = payload.repository.html_url;
  const branch = payload.pull_request.head.ref;
  const action = payload.action;
  const installationId = payload.installation?.id;

  // Determine event trigger based on action
  let eventTrigger: AgentEventTrigger;

  switch (action) {
    case 'opened':
      eventTrigger = 'pull_request.opened';
      break;
    case 'reopened':
      eventTrigger = 'pull_request.reopened';
      break;
    case 'synchronize':
      eventTrigger = 'pull_request.synchronize';
      break;
    default: {
      const _exhaustiveCheck: never = action;
      throw new Error(`Invalid action: ${_exhaustiveCheck}`);
    }
  }

  if (!installationId) {
    throw new Error('Installation ID is required');
  }

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

  const automationTasks = await getAgentTasksForEvent({
    organizationId: apiKey.organizationId,
    eventTrigger,
    repository: repo,
    branch,
  });

  if (automationTasks.length === 0) {
    console.info(`No agent tasks found for event ${eventTrigger}`);
    return;
  }

  const context: GithubContext = {
    action: payload.action,
    prNumber: payload.pull_request.number?.toString(),
    repo,
    repo_url: repoUrl,
    head_branch: branch,
    base_branch: payload.pull_request.base.ref,
  };

  if (payload.action === 'synchronize') {
    context.after = payload.after;
    context.before = payload.before;
  }

  for (const { task } of automationTasks) {
    console.info(`Running agent task ${task.agentName} for event ${eventTrigger}`);
    switch (task.agentName) {
      case 'documentation_agent': {
        await runDocsAgentAsync({
          installationToken: authDetails.installationId.toString(),
          repoUrl,
          branch,
          apiKey: apiKey.key,
          context: context,
          organizationId: apiKey.organizationId,
        });
        break;
      }
      case 'upstream_conflict_agent':
        break;
      default: {
        const _exhaustiveCheck: never = task.agentName;
        throw new Error(`Invalid agent type: ${_exhaustiveCheck}`);
      }
    }
  }
}
