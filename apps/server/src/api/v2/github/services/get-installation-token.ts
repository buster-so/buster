import {
  getActiveGithubIntegration,
  getGithubIntegrationByInstallationId,
} from '@buster/database/queries';
import {
  generateNewInstallationToken,
  isTokenExpired,
  retrieveInstallationToken,
} from '@buster/github';
import type { InstallationTokenResponse } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';

/**
 * Get an installation token for a specific installation ID
 * Will return cached token if still valid, otherwise generates a new one
 */
export async function getInstallationToken(
  installationId: string
): Promise<InstallationTokenResponse> {
  console.info(`Getting installation token for ${installationId}`);

  // First, verify the installation exists in our database
  const integration = await getGithubIntegrationByInstallationId(installationId);

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `No integration found for installation ${installationId}`
    );
  }

  if (integration.status === 'suspended') {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_SUSPENDED,
      `Installation ${installationId} is suspended`
    );
  }

  if (integration.status === 'revoked' || integration.deletedAt !== null) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `Installation ${installationId} has been revoked`
    );
  }

  // Check if we have a cached token that's still valid
  const cachedToken = await retrieveInstallationToken(installationId);

  if (cachedToken && !isTokenExpired(cachedToken.metadata.expiresAt)) {
    console.info(`Using cached token for installation ${installationId}`);

    return {
      token: cachedToken.token,
      expires_at: cachedToken.metadata.expiresAt,
      permissions: cachedToken.metadata.permissions,
      repository_selection: cachedToken.metadata.repositorySelection,
    };
  }

  // Generate a new token
  console.info(`Generating new token for installation ${installationId}`);

  return await generateNewInstallationToken(installationId);
}

/**
 * Get an installation token by organization ID
 * Looks up the active integration for the org and returns its token
 */
export async function getInstallationTokenByOrgId(
  organizationId: string
): Promise<InstallationTokenResponse> {
  const integration = await getActiveGithubIntegration(organizationId);

  if (!integration) {
    throw createGitHubError(
      GitHubErrorCode.INSTALLATION_NOT_FOUND,
      `No active GitHub integration found for organization ${organizationId}`
    );
  }

  return await getInstallationToken(integration.installationId);
}

/**
 * Verify that an installation belongs to a specific organization
 */
export async function verifyInstallationOwnership(
  installationId: string,
  organizationId: string
): Promise<boolean> {
  const integration = await getGithubIntegrationByInstallationId(installationId);

  if (!integration) {
    return false;
  }

  return (
    integration.organizationId === organizationId &&
    integration.status === 'active' &&
    integration.deletedAt === null
  );
}

/**
 * Create a GitHub operation error
 */
function createGitHubError(code: GitHubErrorCode, message: string): Error {
  const error = new Error(message) as Error & { code: GitHubErrorCode };
  error.code = code;
  return error;
}
