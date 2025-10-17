import {
  createGithubIntegration,
  getGithubIntegrationByInstallationId,
  markGithubIntegrationAsFailed,
  softDeleteGithubIntegration,
  updateGithubIntegration,
} from '@buster/database/queries';
import type { githubIntegrations } from '@buster/database/schema';
import {
  deleteInstallationToken,
  GitHubErrorCode,
  type InstallationCallbackRequest,
} from '@buster/github';
import type { InferSelectModel } from 'drizzle-orm';

type GitHubIntegration = InferSelectModel<typeof githubIntegrations>;

interface HandleInstallationParams {
  payload: InstallationCallbackRequest;
  organizationId: string;
  userId: string;
}

/**
 * Handle GitHub App installation webhook callback
 * Processes different actions: created, deleted, suspend, unsuspend
 */
export async function handleInstallationCallback(
  params: HandleInstallationParams
): Promise<GitHubIntegration> {
  const { payload, organizationId, userId } = params;
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

      case 'deleted':
        return await handleInstallationDeleted(installation.id.toString());

      case 'suspend':
        return await handleInstallationSuspended(installation.id.toString());

      case 'unsuspend':
        return await handleInstallationUnsuspended(installation.id.toString());

      default:
        throw createGitHubError(
          GitHubErrorCode.WEBHOOK_PROCESSING_FAILED,
          `Unsupported webhook action: ${action}`
        );
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
  installation: InstallationCallbackRequest['installation'];
  repositories?: InstallationCallbackRequest['repositories'];
  organizationId: string;
  userId: string;
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
    });

    if (!updated) {
      throw createGitHubError(
        GitHubErrorCode.DATABASE_ERROR,
        `Failed to update integration for installation ${installation.id}`
      );
    }

    return updated;
  }

  // Create new integration
  const integration = await createGithubIntegration({
    installationId: installation.id.toString(),
    githubOrgId: installation.account.id.toString(),
    githubOrgName: installation.account.login,
    organizationId,
    userId,
    status: 'active',
  });

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.DATABASE_ERROR,
      `Failed to create integration for installation ${installation.id}`
    );
  }

  console.info(`Created GitHub integration for installation ${installation.id}`);

  return integration;
}

/**
 * Handle GitHub App uninstallation
 */
async function handleInstallationDeleted(installationId: string): Promise<GitHubIntegration> {
  const integration = await getGithubIntegrationByInstallationId(installationId);

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `Integration not found for installation ${installationId}`
    );
  }

  // Delete token from vault
  await deleteInstallationToken(installationId);

  // Soft delete the integration
  const deleted = await softDeleteGithubIntegration(integration.id);

  if (!deleted) {
    throw createGitHubError(
      GitHubErrorCode.DATABASE_ERROR,
      `Failed to delete integration for installation ${installationId}`
    );
  }

  console.info(`Deleted GitHub integration for installation ${installationId}`);

  return deleted;
}

/**
 * Handle GitHub App suspension
 */
async function handleInstallationSuspended(installationId: string): Promise<GitHubIntegration> {
  const integration = await getGithubIntegrationByInstallationId(installationId);

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `Integration not found for installation ${installationId}`
    );
  }

  // Mark as suspended (failed)
  const suspended = await markGithubIntegrationAsFailed(
    integration.id,
    'Installation suspended by GitHub'
  );

  if (!suspended) {
    throw createGitHubError(
      GitHubErrorCode.DATABASE_ERROR,
      `Failed to suspend integration for installation ${installationId}`
    );
  }

  console.info(`Suspended GitHub integration for installation ${installationId}`);

  return suspended;
}

/**
 * Handle GitHub App unsuspension
 */
async function handleInstallationUnsuspended(installationId: string): Promise<GitHubIntegration> {
  const integration = await getGithubIntegrationByInstallationId(installationId);

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `Integration not found for installation ${installationId}`
    );
  }

  // Update status to active
  const unsuspended = await updateGithubIntegration(integration.id, {
    status: 'active',
  });

  if (!unsuspended) {
    throw createGitHubError(
      GitHubErrorCode.DATABASE_ERROR,
      `Failed to unsuspend integration for installation ${installationId}`
    );
  }

  console.info(`Unsuspended GitHub integration for installation ${installationId}`);

  return unsuspended;
}

/**
 * Generate and store an installation token
 */
// Commenting out for now since I don't believe we should store tokens. If we want to then we can add it back easily.
// async function generateAndStoreToken(installationId: string): Promise<string> {
//   try {
//     const app = createGitHubApp();

//     // Generate installation access token
//     const { data } = await app.octokit.rest.apps.createInstallationAccessToken({
//       installation_id: Number.parseInt(installationId, 10),
//     });

//     // Store token in vault
//     const vaultKey = await storeInstallationToken(
//       installationId,
//       data.token,
//       data.expires_at,
//       data.permissions,
//       data.repository_selection
//     );

//     console.info(`Generated and stored token for installation ${installationId}`);

//     return vaultKey;
//   } catch (error) {
//     console.error(`Failed to generate token for installation ${installationId}:`, error);
//     throw createGitHubError(
//       GitHubErrorCode.TOKEN_GENERATION_FAILED,
//       `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`
//     );
//   }
// }

/**
 * Create a GitHub operation error
 */
function createGitHubError(code: GitHubErrorCode, message: string): Error {
  const error = new Error(message) as Error & { code: GitHubErrorCode };
  error.code = code;
  return error;
}
