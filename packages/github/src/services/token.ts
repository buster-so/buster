import type { InstallationTokenResponse } from '@buster/server-shared/github';
import { createGitHubApp } from '../client/app';

/**
 * Generate a new installation token from GitHub
 */
export async function generateNewInstallationToken(
  installationId: string
): Promise<InstallationTokenResponse> {
  try {
    const app = createGitHubApp();

    // Create installation access token
    const { data } = await app.octokit.rest.apps.createInstallationAccessToken({
      installation_id: Number.parseInt(installationId, 10),
    });

    return {
      token: data.token,
      expires_at: data.expires_at,
      permissions: data.permissions,
      repository_selection: data.repository_selection,
    };
  } catch (error) {
    console.error(`Failed to generate token for installation ${installationId}:`, error);
    throw Error(`Failed to generate installation token`);
  }
}
