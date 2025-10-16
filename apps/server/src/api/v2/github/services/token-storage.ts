import {
  createSecret,
  deleteSecret,
  getSecretByName,
  updateSecret,
} from '@buster/database/queries';
import { GitHubErrorCode } from '@buster/server-shared/github';

interface TokenMetadata {
  installationId: string;
  expiresAt: string;
  permissions?: Record<string, string> | undefined;
  repositorySelection?: 'all' | 'selected' | undefined;
}

/**
 * Generate a vault key for a GitHub installation token
 */
export function generateTokenVaultKey(installationId: string): string {
  return `github_installation_${installationId}_token`;
}

/**
 * Store a GitHub installation token in the vault
 */
export async function storeInstallationToken(
  installationId: string,
  token: string,
  expiresAt: string,
  permissions?: Record<string, string>,
  repositorySelection?: 'all' | 'selected'
): Promise<string> {
  const key = generateTokenVaultKey(installationId);

  const metadata: TokenMetadata = {
    installationId,
    expiresAt,
    permissions,
    repositorySelection,
  };

  try {
    // Check if a secret with this key already exists
    const existingSecret = await getSecretByName(key);

    if (existingSecret) {
      // Update existing secret
      const vaultId = await updateSecret({
        id: existingSecret.id,
        secret: token,
        name: key,
        description: JSON.stringify(metadata),
      });

      console.info(`Updated GitHub installation token for installation ${installationId}`);
      return vaultId;
    }

    // Create new secret
    const vaultId = await createSecret({
      secret: token,
      name: key,
      description: JSON.stringify(metadata),
    });

    console.info(`Stored new GitHub installation token for installation ${installationId}`);
    return vaultId;
  } catch (error) {
    console.error('Failed to store GitHub installation token:', error);
    throw createGitHubError(
      GitHubErrorCode.TOKEN_STORAGE_FAILED,
      `Failed to store token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve a GitHub installation token from the vault
 */
export async function retrieveInstallationToken(
  installationId: string
): Promise<{ token: string; metadata: TokenMetadata } | null> {
  const key = generateTokenVaultKey(installationId);

  try {
    const secret = await getSecretByName(key);

    if (!secret) {
      return null;
    }

    // Parse metadata from description
    let metadata: TokenMetadata;
    try {
      metadata = secret.description
        ? (JSON.parse(secret.description) as TokenMetadata)
        : {
            installationId,
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Default to expired (24 hours ago) if no metadata
          };
    } catch {
      // If description is not valid JSON, create minimal metadata
      metadata = {
        installationId,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Default to expired (24 hours ago)
      };
    }

    return {
      token: secret.secret,
      metadata,
    };
  } catch (error) {
    console.error('Failed to retrieve GitHub installation token:', error);
    return null;
  }
}

/**
 * Delete a GitHub installation token from the vault
 */
export async function deleteInstallationToken(installationId: string): Promise<void> {
  const key = generateTokenVaultKey(installationId);

  try {
    const secret = await getSecretByName(key);

    if (secret) {
      await deleteSecret(secret.id);
      console.info(`Deleted GitHub installation token for installation ${installationId}`);
    }
  } catch (error) {
    console.error('Failed to delete GitHub installation token:', error);
    // Don't throw - deletion errors are not critical
  }
}

/**
 * Check if a stored token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  const expiryDate = new Date(expiresAt);
  const now = new Date();

  // Consider token expired 5 minutes before actual expiry for safety
  const bufferMs = 5 * 60 * 1000; // 5 minutes in milliseconds
  const effectiveExpiry = new Date(expiryDate.getTime() - bufferMs);

  return now >= effectiveExpiry;
}

/**
 * Create a GitHub operation error
 */
function createGitHubError(code: GitHubErrorCode, message: string): Error {
  const error = new Error(message) as Error & { code: GitHubErrorCode };
  error.code = code;
  return error;
}
