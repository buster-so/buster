import {
  createSecret,
  deleteSecret,
  getSecretByName,
  updateSecret,
} from '@buster/database/queries';
import type {
  ISlackOAuthStateStorage,
  ISlackTokenStorage,
  SlackOAuthStateData,
} from '@buster/slack';
import * as slackHelpers from './slack-helpers';

/**
 * Database Vault-based token storage implementation
 */
export class DatabaseVaultTokenStorage implements ISlackTokenStorage {
  async storeToken(key: string, token: string): Promise<void> {
    try {
      // Check if a secret with this name already exists
      const existingSecret = await getSecretByName(key);

      if (existingSecret) {
        // Update existing secret
        await updateSecret({
          id: existingSecret.id,
          secret: token,
          name: key,
        });
      } else {
        // Create new secret
        await createSecret({
          secret: token,
          name: key,
          description: 'Slack OAuth token',
        });
      }
    } catch (error) {
      console.error('Token storage error:', error);
      throw new Error(
        `Failed to store token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const secret = await getSecretByName(key);

      if (!secret) {
        return null;
      }

      return secret.secret;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  async deleteToken(key: string): Promise<void> {
    try {
      const secret = await getSecretByName(key);

      if (secret) {
        await deleteSecret(secret.id);
      }
    } catch (error) {
      console.error('Token deletion error:', error);
      // Don't throw - deletion errors are not critical
    }
  }

  async hasToken(key: string): Promise<boolean> {
    const token = await this.getToken(key);
    return token !== null;
  }
}

/**
 * Database-based OAuth state storage implementation
 */
export class DatabaseOAuthStateStorage implements ISlackOAuthStateStorage {
  async storeState(_state: string, _data: SlackOAuthStateData): Promise<void> {
    // The pending integration is already created in slack-oauth-service
    // This is called by the Slack package, but we handle it differently
    // State is stored directly in the database during initiateOAuth
    // No error handling needed as this is a no-op by design
  }

  async getState(state: string): Promise<SlackOAuthStateData | null> {
    try {
      const integration = await slackHelpers.getPendingIntegrationByState(state);

      if (!integration) {
        return null;
      }

      return {
        expiresAt: new Date(integration.oauthExpiresAt || '').getTime(),
        metadata: integration.oauthMetadata as Record<string, unknown>,
      };
    } catch (error) {
      console.error('Failed to get OAuth state:', error);
      return null;
    }
  }

  async deleteState(_state: string): Promise<void> {
    // State is automatically cleaned up when integration is updated
    // or by the cleanup job for expired states
    // No error handling needed as this is a no-op by design
  }
}

// Export singleton instances
export const tokenStorage = new DatabaseVaultTokenStorage();
export const oauthStateStorage = new DatabaseOAuthStateStorage();
