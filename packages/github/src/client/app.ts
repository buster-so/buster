import { getSecret } from '@buster/secrets';
import type { GitHubOperationError } from '@buster/server-shared/github';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { App } from 'octokit';

/**
 * Get GitHub App credentials from environment variables or Infisical
 */
export async function getGitHubAppCredentials(): Promise<{
  appId: number;
  privateKey: string;
  webhookSecret: string;
}> {
  let appId: string;
  let privateKeyBase64: string;
  let webhookSecret: string;

  try {
    appId = await getSecret('GITHUB_APP_ID');
  } catch (_error) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      'GITHUB_APP_ID not found in environment or Infisical'
    );
  }

  try {
    privateKeyBase64 = await getSecret('GITHUB_APP_PRIVATE_KEY_BASE64');
  } catch (_error) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      'GITHUB_APP_PRIVATE_KEY_BASE64 not found in environment or Infisical'
    );
  }

  try {
    webhookSecret = await getSecret('GITHUB_WEBHOOK_SECRET');
  } catch (_error) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      'GITHUB_WEBHOOK_SECRET not found in environment or Infisical'
    );
  }

  // Decode the private key from base64
  let privateKey: string;
  try {
    // Check if it's valid base64 first (allow whitespace which will be trimmed)
    const trimmedBase64 = privateKeyBase64.trim();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmedBase64)) {
      throw new Error('Invalid base64 format');
    }
    privateKey = Buffer.from(trimmedBase64, 'base64').toString('utf-8');
  } catch (_error) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      'Failed to decode GITHUB_APP_PRIVATE_KEY_BASE64: Invalid base64 encoding'
    );
  }

  // Validate the private key format (support both RSA and PKCS#8 formats)
  if (!privateKey.includes('BEGIN RSA PRIVATE KEY') && !privateKey.includes('BEGIN PRIVATE KEY')) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      'Invalid GitHub App private key format. Expected PEM-encoded private key'
    );
  }

  return {
    appId: Number.parseInt(appId, 10),
    privateKey,
    webhookSecret,
  };
}

/**
 * Create a configured GitHub App instance
 */
export async function createGitHubApp(): Promise<App> {
  const { appId, privateKey } = await getGitHubAppCredentials();

  try {
    return new App({
      appId,
      privateKey,
    });
  } catch (error) {
    throw createGitHubError(
      GitHubErrorCode.APP_CONFIGURATION_ERROR,
      `Failed to create GitHub App: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a GitHub operation error
 */
function createGitHubError(code: GitHubErrorCode, message: string): Error {
  const error = new Error(message) as Error & GitHubOperationError;
  error.code = code;
  return error;
}
