import {
  createGithubIntegration,
  getGithubIntegrationByInstallationId,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { githubIntegrations } from '@buster/database/schema';
import type { InstallationWebhookEvents } from '@buster/github';
import type { InferSelectModel } from 'drizzle-orm';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

/**
 * Handle GitHub App installation webhook callback
 * Processes different actions: created, deleted, suspend, unsuspend
 */
export async function handleInstallationWebhook(
  payload: InstallationWebhookEvents
): Promise<GitHubIntegration> {
  const { action, installation } = payload;

  console.info(
    `Processing GitHub installation webhook: action=${action}, installationId=${installation.id}`
  );

  try {
    switch (action) {
      case 'created':
        return await handleInstallationCreatedWebhook({
          installation,
          repositories: payload.repositories,
        });

      case 'deleted': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'revoked',
          deletedAt: new Date().toISOString(),
        });

        if (!updated) {
          throw new Error(
            `Failed to delete integration for installation ${payload.installation.id}`
          );
        }

        return updated;
      }

      case 'suspend': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'suspended',
        });

        if (!updated) {
          throw new Error(
            `Failed to suspend integration for installation ${payload.installation.id}`
          );
        }

        return updated;
      }

      case 'unsuspend': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'active',
        });

        if (!updated) {
          throw new Error(
            `Failed to unsuspend integration for installation ${payload.installation.id}`
          );
        }

        return updated;
      }
      case 'new_permissions_accepted': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          accessibleRepositories: payload.repositories,
          permissions: payload.installation.permissions,
        });
        if (!updated) {
          throw new Error(
            `Failed to update permissions for installation ${payload.installation.id}`
          );
        }

        return updated;
      }
      default:
        throw new Error(`Unsupported webhook action: ${action}`);
    }
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
}): Promise<GitHubIntegration> {
  const { installation, repositories } = params;

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
  const maxRetries = 3;
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

  if (!existing) {
    const errorMsg = `Failed to find GitHub integration for installation ${installation.id} after ${maxRetries} attempts`;
    console.error(errorMsg);
    throw new Error(errorMsg);
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
      throw new Error(`Failed to update integration for installation ${installation.id}`);
    }

    return updated;
  }

  throw new Error(`GitHub integration is deleted for installation ${installation.id}`);
}
