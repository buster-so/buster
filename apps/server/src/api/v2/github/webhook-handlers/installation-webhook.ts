import {
  createGithubIntegration,
  getGithubIntegrationByInstallationId,
  getGithubIntegrationRequestByOrgMemberList,
  softDeleteGithubIntegrationRequest,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { githubIntegrations } from '@buster/database/schema';
import type { InstallationWebhookEvents, Octokit } from '@buster/github';
import type { InferSelectModel } from 'drizzle-orm';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

/**
 * Handle GitHub App installation webhook callback
 * Processes different actions: created, deleted, suspend, unsuspend
 */
export async function handleInstallationWebhook(
  payload: InstallationWebhookEvents,
  octokit: Octokit
): Promise<GitHubIntegration> {
  const { action, installation } = payload;

  console.info(
    `Processing GitHub installation webhook: action=${action}, installationId=${installation.id}`
  );

  try {
    // Handle 'created' action separately since it has special retry logic
    if (action === 'created') {
      return await handleInstallationCreatedWebhook({
        installation,
        repositories: payload.repositories,
        octokit,
      });
    }

    // For all other actions, fetch the existing integration
    const existing = await getGithubIntegrationByInstallationId(installation.id.toString());

    if (!existing) {
      throw new Error(`Integration not found for installation ${installation.id}`);
    }

    // Handle each action type
    if (action === 'deleted') {
      const updated = await updateGithubIntegration(existing.id, {
        status: 'revoked',
        deletedAt: new Date().toISOString(),
      });

      if (!updated) {
        throw new Error(`Failed to delete integration for installation ${payload.installation.id}`);
      }

      return updated;
    }

    if (action === 'suspend') {
      const updated = await updateGithubIntegration(existing.id, {
        status: 'suspended',
      });

      if (!updated) {
        throw new Error(
          `Failed to suspend integration for installation ${payload.installation.id}`
        );
      }

      return updated;
    }

    if (action === 'unsuspend') {
      const updated = await updateGithubIntegration(existing.id, {
        status: 'active',
      });

      if (!updated) {
        throw new Error(
          `Failed to unsuspend integration for installation ${payload.installation.id}`
        );
      }

      return updated;
    }

    if (action === 'new_permissions_accepted') {
      const updated = await updateGithubIntegration(existing.id, {
        accessibleRepositories: payload.repositories,
        permissions: payload.installation.permissions,
      });

      if (!updated) {
        throw new Error(`Failed to update permissions for installation ${payload.installation.id}`);
      }

      return updated;
    }

    // Exhaustive check - this should never be reached if all action types are handled
    const _exhaustiveCheck: never = action;
    throw new Error(`Unsupported webhook action: ${_exhaustiveCheck}`);
  } catch (error) {
    console.error('Failed to handle installation callback:', error);
    throw error;
  }
}

/**
 * Handle new GitHub App installation
 */
async function handleInstallationCreatedWebhook(params: {
  installation: InstallationWebhookEvents['installation'];
  repositories?: InstallationWebhookEvents['repositories'];
  octokit: Octokit;
}): Promise<GitHubIntegration> {
  const { installation, repositories, octokit } = params;

  let githubOrgName = 'Unknown Account';
  if (installation.account) {
    if ('login' in installation.account) {
      githubOrgName = installation.account.login;
    } else if ('name' in installation.account) {
      githubOrgName = installation.account.name;
    }
  }

  // Check if integration already exists. The setup callback will create the row with user/org data.
  // We need to wait for the row to be created before adding the installation metadata.
  let existing: GitHubIntegration | undefined;
  const maxRetries = 5;
  const baseBackoffMs = 300;
  const maxJitterMs = 200;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    existing = await getGithubIntegrationByInstallationId(installation.id.toString());

    if (existing) {
      break;
    }

    if (attempt < maxRetries - 1) {
      const jitter = Math.random() * maxJitterMs;
      const backoff = baseBackoffMs + jitter;
      console.info(
        `Integration not found for installation ${installation.id}, retrying in ${backoff.toFixed(0)}ms (attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  // If no integration found after retries, check for pending requests
  if (!existing) {
    console.info(
      `No integration found for installation ${installation.id}, checking for pending requests`
    );

    let orgMembers: string[] = [];
    if (
      installation.account &&
      'type' in installation.account &&
      installation.account.type === 'Organization'
    ) {
      const membersResponse = await octokit.rest.orgs.listMembers({
        org: installation.account.login,
        per_page: 100,
      });
      orgMembers = membersResponse.data.map((member) => member.login);
    } else {
      orgMembers = [githubOrgName];
    }

    // Look for pending request by GitHub login
    const pendingRequest = await getGithubIntegrationRequestByOrgMemberList(orgMembers);

    if (!pendingRequest) {
      throw new Error('Unable to match installation with a pending request');
    }

    // Create integration from pending request
    console.info(
      `Creating integration from pending request for ${githubOrgName}, org ${pendingRequest.organizationId}`
    );

    const newIntegration = await createGithubIntegration({
      installationId: installation.id.toString(),
      appId: installation.app_id?.toString() ?? '0',
      githubOrgId: installation.account?.id.toString() ?? '0',
      githubOrgName,
      organizationId: pendingRequest.organizationId,
      userId: pendingRequest.userId,
      permissions: installation.permissions ?? {},
      accessibleRepositories: repositories ?? [],
      status: 'active',
    });

    if (!newIntegration) {
      throw new Error(`Failed to create integration for installation ${installation.id}`);
    }

    // Soft delete the pending request since it's now fulfilled
    await softDeleteGithubIntegrationRequest(pendingRequest.id);

    return newIntegration;
  }

  if (existing.deletedAt === null) {
    console.info(`GitHub integration already exists for installation ${installation.id}`);

    // Update existing integration to ensure it's active
    const updated = await updateGithubIntegration(existing.id, {
      status: 'active',
      githubOrgName,
      githubOrgId: installation.account?.id.toString() ?? '0',
      accessibleRepositories: repositories,
      permissions: installation.permissions,
    });

    if (!updated) {
      throw new Error(`No integrations updated for installation ${installation.id}`);
    }

    return updated;
  }

  throw new Error(`GitHub integration is deleted for installation ${installation.id}`);
}
