import type { Octokit } from 'octokit';
import { createGitHubApp } from '../client/app';

/**
 * Create an Installation Octokit client for making authenticated API calls
 * as a GitHub App installation
 */
export async function createInstallationOctokit(installationId: string): Promise<Octokit> {
  try {
    const app = createGitHubApp();
    const octokit = await app.getInstallationOctokit(Number.parseInt(installationId, 10));
    return octokit;
  } catch (error) {
    console.error(
      `Failed to create Installation Octokit for installation ${installationId}:`,
      error
    );
    throw Error(`Failed to create Installation Octokit`);
  }
}
