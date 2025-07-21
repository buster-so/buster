import { createSecret, deleteSecret, getSecretByName, updateSecret } from '@buster/database';
import type {
  IGitHubOAuthStateStorage,
  IGitHubTokenStorage,
  GitHubOAuthStateData,
} from '@buster/github';
import * as githubHelpers from './github-helpers';

export class DatabaseVaultTokenStorage implements IGitHubTokenStorage {
  async storeToken(key: string, token: string): Promise<void> {
    try {
      const existingSecret = await getSecretByName(key);

      if (existingSecret) {
        await updateSecret({
          id: existingSecret.id,
          secret: token,
          name: key,
        });
      } else {
        await createSecret({
          secret: token,
          name: key,
          description: 'GitHub OAuth token',
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
    }
  }

  async hasToken(key: string): Promise<boolean> {
    const token = await this.getToken(key);
    return token !== null;
  }
}

export class DatabaseOAuthStateStorage implements IGitHubOAuthStateStorage {
  async storeState(_state: string, _data: GitHubOAuthStateData): Promise<void> {
  }

  async getState(state: string): Promise<GitHubOAuthStateData | null> {
    try {
      const integration = await githubHelpers.getPendingIntegrationByState(state);

      if (!integration) {
        return null;
      }

      return {
        expiresAt: new Date(integration.createdAt).getTime() + 15 * 60 * 1000,
        metadata: {},
      };
    } catch (error) {
      console.error('Failed to get OAuth state:', error);
      return null;
    }
  }

  async deleteState(_state: string): Promise<void> {
  }
}

export const tokenStorage = new DatabaseVaultTokenStorage();
export const oauthStateStorage = new DatabaseOAuthStateStorage();
