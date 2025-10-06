import { getSecretByName } from '@buster/database/queries';
import { createSecret, deleteSecret, updateSecret } from '@buster/database/queries';

interface InstallationState {
  userId: string;
  organizationId: string;
  createdAt: string;
}

/**
 * Generate a vault key for OAuth state
 */
function generateStateVaultKey(state: string): string {
  return `github_app_state_${state}`;
}

/**
 * Store installation state for OAuth flow
 * State expires after 10 minutes
 */
export async function storeInstallationState(
  state: string,
  data: InstallationState
): Promise<void> {
  const key = generateStateVaultKey(state);
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const description = `GitHub App state expires at ${expirationTime}`;

  try {
    // Check if state already exists (shouldn't happen with random generation)
    const existing = await getSecretByName(key);

    if (existing) {
      await updateSecret({
        id: existing.id,
        secret: JSON.stringify(data),
        name: key,
        description,
      });
    } else {
      await createSecret({
        secret: JSON.stringify(data),
        name: key,
        description,
      });
    }

    console.info(`Stored App state for user ${data.userId}, org ${data.organizationId}`);
  } catch (error) {
    console.error('Failed to store App state:', error);
    throw new Error('Failed to store installation state');
  }
}

/**
 * Retrieve and validate installation state
 * Returns null if state doesn't exist or is expired
 */
export async function retrieveInstallationState(state: string): Promise<InstallationState | null> {
  const key = generateStateVaultKey(state);

  try {
    const secret = await getSecretByName(key);

    if (!secret) {
      console.warn(`State not found: ${state}`);
      return null;
    }

    // Check if state is expired (10 minutes)
    let data: InstallationState;
    try {
      data = JSON.parse(secret.secret) as InstallationState;
    } catch (error) {
      console.error('Failed to parse App state data:', error);
      await deleteSecret(secret.id);
      return null;
    }
    const createdAt = new Date(data.createdAt);
    const now = new Date();
    const tenMinutes = 10 * 60 * 1000;

    if (now.getTime() - createdAt.getTime() > tenMinutes) {
      console.warn(`App state expired: ${state}`);
      // Clean up expired state
      await deleteSecret(secret.id);
      return null;
    }

    // Delete state after retrieval (one-time use)
    await deleteSecret(secret.id);

    console.info(`Retrieved App state for user ${data.userId}, org ${data.organizationId}`);
    return data;
  } catch (error) {
    console.error('Failed to retrieve App state:', error);
    return null;
  }
}

/**
 * Clean up expired App states
 * This should be called periodically to clean up old states
 */
export async function cleanupExpiredStates(): Promise<void> {
  // This would need to be implemented with a query that finds all github_oauth_state_* secrets
  // and checks their description for expiry time
  // For now, states are cleaned up on retrieval if expired
  console.info('Cleanup of expired OAuth states would happen here');
}
