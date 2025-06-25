import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import type { ISlackOAuthStateStorage, ISlackTokenStorage } from '../interfaces/token-storage';
import {
  type SlackIntegrationResult,
  SlackIntegrationResultSchema,
  type SlackOAuthConfig,
  SlackOAuthResponse,
  SlackOAuthResponseSchema,
  SlackOAuthStateSchema,
} from '../types';
import { SlackIntegrationError } from '../types/errors';
import { generateSecureState, isExpired, validateWithSchema } from '../utils/validation-helpers';

export class SlackAuthService {
  private slackClient: WebClient;

  constructor(
    private config: SlackOAuthConfig,
    private tokenStorage: ISlackTokenStorage,
    private stateStorage: ISlackOAuthStateStorage
  ) {
    this.slackClient = new WebClient();
  }

  /**
   * Generate OAuth URL and state for authorization
   * @param metadata Optional metadata to store with state
   * @returns Auth URL and state
   */
  async generateAuthUrl(metadata?: Record<string, unknown>): Promise<{
    authUrl: string;
    state: string;
  }> {
    const state = generateSecureState();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store state for CSRF protection
    await this.stateStorage.storeState(state, {
      expiresAt,
      metadata,
    });

    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('scope', this.config.scopes.join(','));
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('state', state);

    return {
      authUrl: authUrl.toString(),
      state,
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param code Authorization code from Slack
   * @param state State parameter for CSRF protection
   * @param tokenKey Key to store the access token (e.g., userId)
   * @returns Integration result with team info
   */
  async handleCallback(
    code: string,
    state: string,
    tokenKey: string
  ): Promise<SlackIntegrationResult> {
    // Validate state
    const stateData = await this.stateStorage.getState(state);

    if (!stateData) {
      throw new SlackIntegrationError('OAUTH_INVALID_STATE', 'Invalid or expired OAuth state');
    }

    // Clean up state
    await this.stateStorage.deleteState(state);

    // Check if state expired
    if (isExpired(stateData.expiresAt)) {
      throw new SlackIntegrationError('OAUTH_INVALID_STATE', 'OAuth state has expired');
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);

      // Validate response
      const oauthData = validateWithSchema(
        SlackOAuthResponseSchema,
        tokenResponse,
        'Invalid OAuth response from Slack'
      );

      if (!oauthData.ok) {
        throw new SlackIntegrationError(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          `Slack OAuth failed: ${(tokenResponse as any).error || 'Unknown error'}`
        );
      }

      // Test the token
      await this.validateToken(oauthData.access_token);

      // Store access token
      await this.tokenStorage.storeToken(tokenKey, oauthData.access_token);

      // Return integration result
      const result: SlackIntegrationResult = {
        teamId: oauthData.team.id,
        teamName: oauthData.team.name,
        teamDomain: oauthData.team.domain || '',
        botUserId: oauthData.bot_user_id,
        scope: oauthData.scope,
        installerUserId: oauthData.authed_user.id,
        enterpriseId: oauthData.enterprise?.id,
        accessToken: oauthData.access_token,
      };

      return validateWithSchema(SlackIntegrationResultSchema, result, 'Invalid integration result');
    } catch (error) {
      // Clean up token if something went wrong
      await this.tokenStorage.deleteToken(tokenKey).catch(() => {});

      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      throw new SlackIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to complete OAuth flow',
        false,
        { originalError: error }
      );
    }
  }

  /**
   * Test if a token is valid
   * @param tokenKey Key to retrieve the token
   * @returns true if token is valid
   */
  async testToken(tokenKey: string): Promise<boolean> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return false;
      }

      const response = await this.slackClient.auth.test({
        token: accessToken,
      });

      return response.ok === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke access token and clean up
   * @param tokenKey Key to retrieve the token
   */
  async revokeToken(tokenKey: string): Promise<void> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return; // Already gone
      }

      // Try to revoke with Slack
      try {
        await this.slackClient.auth.revoke({
          token: accessToken,
        });
      } catch (error) {
        // Log but don't fail - token might already be revoked
        console.warn('Failed to revoke token with Slack:', error);
      }
    } finally {
      // Always delete from storage
      await this.tokenStorage.deleteToken(tokenKey);
    }
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from Slack
   * @returns Raw response from Slack API
   */
  private async exchangeCodeForTokens(code: string): Promise<unknown> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new SlackIntegrationError(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      throw new SlackIntegrationError('NETWORK_ERROR', 'Failed to exchange code for token', true, {
        originalError: error,
      });
    }
  }

  /**
   * Validate access token with Slack
   * @param accessToken Token to validate
   */
  private async validateToken(accessToken: string): Promise<void> {
    try {
      const response = await this.slackClient.auth.test({
        token: accessToken,
      });

      if (!response.ok) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Token validation failed');
      }
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      throw new SlackIntegrationError('NETWORK_ERROR', 'Failed to validate token', true, {
        originalError: error,
      });
    }
  }
}
