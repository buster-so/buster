import {
  createGithubIntegration,
  getGithubIntegrationByInstallationId,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { githubIntegrations } from '@buster/database/schema';
import type { AnyInstallationEvent } from '@buster/github';
import type { InferSelectModel } from 'drizzle-orm';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

/**
 * Handle GitHub App installation webhook callback
 * Processes different actions: created, deleted, suspend, unsuspend
 */
export async function handleInstallationCallback(
  payload: AnyInstallationEvent,
  organizationId?: string,
  userId?: string
): Promise<GitHubIntegration> {
  const { action, installation } = payload;

  console.info(
    `Processing GitHub installation webhook: action=${action}, installationId=${installation.id}`
  );

  try {
    switch (action) {
      case 'created':
        return await handleInstallationCreated({
          installation,
          repositories: payload.repositories,
          organizationId,
          userId,
        });

      case 'deleted': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'revoked',
          deletedAt: new Date().toISOString(),
        });

        if (!updated) {
          throw new Error(`Failed to delete integration for installation ${payload.installation.id}`);
        }

        return updated;
      }

      case 'suspend': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'suspended',
        });

        if (!updated) {
          throw new Error(`Failed to suspend integration for installation ${payload.installation.id}`);
        }

        return updated;
      }

      case 'unsuspend': {
        const updated = await updateGithubIntegration(payload.installation.id.toString(), {
          status: 'active',
        });

        if (!updated) {
          throw new Error(`Failed to unsuspend integration for installation ${payload.installation.id}`);
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
async function handleInstallationCreated(params: {
  installation: AnyInstallationEvent['installation'];
  repositories?: AnyInstallationEvent['repositories'];
  organizationId?: string | undefined;
  userId?: string | undefined;
}): Promise<GitHubIntegration> {
  const { installation, organizationId, userId } = params;

  // Check if integration already exists
  const existing = await getGithubIntegrationByInstallationId(installation.id.toString());

  if (existing && existing.deletedAt === null) {
    console.info(`GitHub integration already exists for installation ${installation.id}`);

    // Update existing integration to ensure it's active
    const updated = await updateGithubIntegration(existing.id, {
      status: 'active',
      githubOrgName: installation.account.login,
      githubOrgId: installation.account.id.toString(),
      // TODO: Add accessible repositories
      // accessibleRepositories: repositories,
      permissions: installation.permissions,
    });

    if (!updated) {
      throw new Error(`Failed to update integration for installation ${installation.id}`);
    }

    return updated;
  }

  if (!organizationId || !userId) {
    throw new Error('Organization ID and user ID are required to create a new integration');
  }

  // Create new integration
  const integration = await createGithubIntegration({
    installationId: installation.id.toString(),
    appId: installation.app_id.toString(),
    githubOrgId: installation.account.id.toString(),
    githubOrgName: installation.account.login,
    // accessibleRepositories: repositories,
    permissions: installation.permissions,
    organizationId,
    userId,
    status: 'active',
  });

  if (!integration) {
    throw new Error(`Failed to create integration for installation ${installation.id}`);
  }

  console.info(`Created GitHub integration for installation ${installation.id}`);

  return integration;
}
