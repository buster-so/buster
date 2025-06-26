import type {
  ISlackOAuthStateStorage,
  ISlackTokenStorage,
  SlackOAuthStateData,
} from '@buster/slack';
import { createClient } from '@supabase/supabase-js';
import * as slackHelpers from './slack-helpers';

/**
 * Supabase Vault-based token storage implementation
 */
export class SupabaseTokenStorage implements ISlackTokenStorage {
  private supabase;

  constructor() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
          'Supabase configuration missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
        );
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error) {
      console.error('Failed to initialize SupabaseTokenStorage:', error);
      throw error;
    }
  }

  async storeToken(key: string, token: string): Promise<void> {
    try {
      // Store in Supabase Vault
      const { error } = await this.supabase.rpc('vault_secret_create', {
        secret: token,
        name: key,
      });

      if (error) {
        console.error('Failed to store token in vault:', error);
        throw new Error('Failed to store token');
      }
    } catch (error) {
      console.error('Token storage error:', error);
      throw error;
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('vault_secret_retrieve', {
        name: key,
      });

      if (error || !data) {
        return null;
      }

      return data.secret;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  async deleteToken(key: string): Promise<void> {
    try {
      await this.supabase.rpc('vault_secret_delete', {
        name: key,
      });
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
export const tokenStorage = new SupabaseTokenStorage();
export const oauthStateStorage = new DatabaseOAuthStateStorage();
