import { App } from 'octokit';

/**
 * Get GitHub App credentials from environment variables
 */
export function getGitHubAppCredentials(): {
  appId: number;
  privateKey: string;
  webhookSecret: string;
} {
  const appId = process.env.GH_APP_ID;
  const privateKeyBase64 = process.env.GH_APP_PRIVATE_KEY_BASE64;
  const webhookSecret = process.env.GH_WEBHOOK_SECRET;

  if (!appId) {
    throw new Error(
      'GH_APP_ID environment variable is not set'
    );
  }

  if (!privateKeyBase64) {
    throw new Error('GH_APP_PRIVATE_KEY_BASE64 environment variable is not set');
  }

  if (!webhookSecret) {
    throw new Error('GH_WEBHOOK_SECRET environment variable is not set');
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
    throw new Error('Failed to decode GH_APP_PRIVATE_KEY_BASE64: Invalid base64 encoding');
  }

  // Validate the private key format (support both RSA and PKCS#8 formats)
  if (!privateKey.includes('BEGIN RSA PRIVATE KEY') && !privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid GitHub App private key format. Expected PEM-encoded private key');
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
export function createGitHubApp(): App {
  const { appId, privateKey, webhookSecret } = getGitHubAppCredentials();

  try {
    return new App({
      appId,
      privateKey,
      webhooks: {
        secret: webhookSecret,
      },
    });
  } catch (error) {
    throw new Error(`Failed to create GitHub App: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
