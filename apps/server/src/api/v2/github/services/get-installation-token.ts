import {
  getActiveGithubIntegration,
  getGithubIntegrationByInstallationId,
  updateGithubIntegration,
} from '@buster/database';
import type { InstallationTokenResponse } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { createGitHubApp } from './github-app';
import { isTokenExpired, retrieveInstallationToken, storeInstallationToken } from './token-storage';

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

  return await generateNewInstallationToken(installationId, integration.id);
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
 * Generate a new installation token from GitHub
 */
async function generateNewInstallationToken(
  installationId: string,
  integrationId: string
): Promise<InstallationTokenResponse> {
  try {
    const app = await createGitHubApp();

    // Create installation access token
    const { data } = await app.octokit.rest.apps.createInstallationAccessToken({
      installation_id: Number.parseInt(installationId, 10),
    });

    // Store the new token in vault
    const vaultKey = await storeInstallationToken(
      installationId,
      data.token,
      data.expires_at,
      data.permissions,
      data.repository_selection
    );

    // Update the integration with the new vault key
    await updateGithubIntegration(integrationId, {
      tokenVaultKey: vaultKey,
      status: 'active', // Ensure status is active after successful token generation
    });

    console.info(
      `Generated new token for installation ${installationId}, expires at ${data.expires_at}`
    );

    return {
      token: data.token,
      expires_at: data.expires_at,
      permissions: data.permissions,
      repository_selection: data.repository_selection,
    };
  } catch (error) {
    console.error(`Failed to generate token for installation ${installationId}:`, error);

    // If token generation fails, mark the integration as failed
    await updateGithubIntegration(integrationId, {
      status: 'suspended',
    });

    throw createGitHubError(
      GitHubErrorCode.TOKEN_GENERATION_FAILED,
      `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
