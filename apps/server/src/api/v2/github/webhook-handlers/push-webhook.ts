import { getAgentTasksForEvent, getApiKeyForInstallationId } from '@buster/database/queries';
import type { AgentEventTrigger } from '@buster/database/schema-types';
import type { Octokit, PushWebhookEvent } from '@buster/github';
import { type GithubContext, runDocsAgentAsync } from '@buster/sandbox';
import { AuthDetailsAppInstallationResponseSchema } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handle GitHub App push webhook callback
 * Processes push events to branches
 */
export async function handlePushWebhook(
  payload: PushWebhookEvent,
  octokit: Octokit
): Promise<void> {
  const repo = payload.repository.full_name;
  const repoUrl = payload.repository.html_url;
  const installationId = payload.installation?.id;

  // Extract branch name from ref (e.g., "refs/heads/main" -> "main")
  const headBranch = payload.ref.split('/').pop();
  const baseBranch = payload.base_ref?.split('/').pop() || headBranch;

  // Push events only have one trigger type
  const eventTrigger: AgentEventTrigger = 'push';

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
    branch: headBranch || '',
  });

  if (automationTasks.length === 0) {
    console.info(`No agent tasks found for event ${eventTrigger}`);
    return;
  }

  const context: GithubContext = {
    action: 'push',
    after: payload.after,
    before: payload.before,
    commits: payload.commits.map((commit: { id: string }) => commit.id),
    head_branch: headBranch,
    base_branch: baseBranch,
    repo,
    repo_url: repoUrl,
  };

  for (const { task } of automationTasks) {
    console.info(`Running agent task ${task.agentName} for event ${eventTrigger}`);
    switch (task.agentName) {
      case 'documentation_agent': {
        await runDocsAgentAsync({
          installationToken: authDetails.installationId.toString(),
          repoUrl,
          branch: headBranch || '',
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
