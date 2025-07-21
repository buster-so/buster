import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import type { IGitHubOAuthStateStorage, IGitHubTokenStorage } from '../interfaces/token-storage';
import {
  type GitHubIntegrationResult,
  GitHubIntegrationResultSchema,
  type GitHubOAuthConfig,
  GitHubOAuthResponse,
  GitHubOAuthResponseSchema,
} from '../types';
import { GitHubIntegrationError } from '../types/errors';
import { generateSecureState, isExpired, validateWithSchema } from '../utils/validation-helpers';

export class GitHubAuthService {
  private githubClient: Octokit;

  constructor(
    private config: GitHubOAuthConfig,
    private tokenStorage: IGitHubTokenStorage,
    private stateStorage: IGitHubOAuthStateStorage,
    client?: Octokit
  ) {
    this.githubClient = client || new Octokit();
  }

  async generateAuthUrl(metadata?: Record<string, unknown>): Promise<{
    authUrl: string;
    state: string;
  }> {
    const state = generateSecureState();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await this.stateStorage.storeState(state, {
      expiresAt,
      metadata: metadata || {},
    });

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('state', state);

    return {
      authUrl: authUrl.toString(),
      state,
    };
  }

  async handleCallback(
    code: string,
    state: string,
    tokenKey: string
  ): Promise<GitHubIntegrationResult> {
    const stateData = await this.stateStorage.getState(state);

    if (!stateData) {
      throw new GitHubIntegrationError('OAUTH_INVALID_STATE', 'Invalid or expired OAuth state');
    }

    await this.stateStorage.deleteState(state);

    if (isExpired(stateData.expiresAt)) {
      throw new GitHubIntegrationError('OAUTH_INVALID_STATE', 'OAuth state has expired');
    }

    try {
      const tokenResponse = await this.exchangeCodeForTokens(code);
      const oauthData = validateWithSchema(
        GitHubOAuthResponseSchema,
        tokenResponse,
        'Invalid OAuth response from GitHub'
      );

      await this.validateToken(oauthData.access_token);
      await this.tokenStorage.storeToken(tokenKey, oauthData.access_token);

      const installationInfo = await this.getInstallationInfo(oauthData.access_token);

      const result: GitHubIntegrationResult = {
        installationId: installationInfo.installationId,
        appId: installationInfo.appId,
        githubOrgId: installationInfo.githubOrgId,
        githubOrgName: installationInfo.githubOrgName,
        accessToken: oauthData.access_token,
        repositoryPermissions: installationInfo.repositoryPermissions,
      };

      return validateWithSchema(GitHubIntegrationResultSchema, result, 'Invalid integration result');
    } catch (error) {
      await this.tokenStorage.deleteToken(tokenKey).catch(() => {});

      if (error instanceof GitHubIntegrationError) {
        throw error;
      }

      throw new GitHubIntegrationError(
        'OAUTH_TOKEN_EXCHANGE_FAILED',
        'Failed to complete OAuth flow',
        false,
        { originalError: error }
      );
    }
  }

  async testToken(tokenKey: string): Promise<boolean> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return false;
      }

      const response = await this.githubClient.rest.users.getAuthenticated({
        headers: {
          authorization: `token ${accessToken}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Failed to test token', error);
      return false;
    }
  }

  async revokeToken(tokenKey: string): Promise<void> {
    try {
      const accessToken = await this.tokenStorage.getToken(tokenKey);
      if (!accessToken) {
        return;
      }

      try {
        await this.githubClient.rest.apps.revokeInstallationAccessToken({
          headers: {
            authorization: `token ${accessToken}`,
          },
        });
      } catch (error) {
        console.warn('Failed to revoke token with GitHub:', error);
      }
    } finally {
      await this.tokenStorage.deleteToken(tokenKey);
    }
  }

  async getGitHubClient(tokenKey: string): Promise<Octokit> {
    const accessToken = await this.tokenStorage.getToken(tokenKey);
    if (!accessToken) {
      throw new GitHubIntegrationError(
        'TOKEN_NOT_FOUND',
        `No access token found for key ${tokenKey}`,
        false
      );
    }

    await this.validateToken(accessToken);

    return new Octokit({
      auth: accessToken,
    });
  }

  private async exchangeCodeForTokens(code: string): Promise<unknown> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new GitHubIntegrationError(
          'OAUTH_TOKEN_EXCHANGE_FAILED',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof GitHubIntegrationError) {
        throw error;
      }

      throw new GitHubIntegrationError('NETWORK_ERROR', 'Failed to exchange code for token', true, {
        originalError: error,
      });
    }
  }

  private async validateToken(accessToken: string): Promise<void> {
    try {
      const response = await this.githubClient.rest.users.getAuthenticated({
        headers: {
          authorization: `token ${accessToken}`,
        },
      });

      if (response.status !== 200) {
        throw new GitHubIntegrationError('INVALID_TOKEN', 'Token validation failed');
      }
    } catch (error) {
      if (error instanceof GitHubIntegrationError) {
        throw error;
      }

      throw new GitHubIntegrationError('NETWORK_ERROR', 'Failed to validate token', true, {
        originalError: error,
      });
    }
  }

  private async getInstallationInfo(accessToken: string): Promise<{
    installationId: string;
    appId?: string;
    githubOrgId: string;
    githubOrgName?: string;
    repositoryPermissions?: Record<string, unknown>;
  }> {
    try {
      const userResponse = await this.githubClient.rest.users.getAuthenticated({
        headers: {
          authorization: `token ${accessToken}`,
        },
      });

      const installationsResponse = await this.githubClient.rest.apps.listInstallationsForAuthenticatedUser({
        headers: {
          authorization: `token ${accessToken}`,
        },
      });

      if (installationsResponse.data.installations.length === 0) {
        throw new GitHubIntegrationError(
          'INSTALLATION_NOT_FOUND',
          'No GitHub App installations found for user'
        );
      }

      const installation = installationsResponse.data.installations[0];
      
      if (!installation) {
        throw new GitHubIntegrationError(
          'INSTALLATION_NOT_FOUND',
          'No GitHub App installation found'
        );
      }

      return {
        installationId: installation.id.toString(),
        appId: installation.app_id?.toString(),
        githubOrgId: userResponse.data.id.toString(),
        githubOrgName: userResponse.data.login,
        repositoryPermissions: installation.permissions || {},
      };
    } catch (error) {
      if (error instanceof GitHubIntegrationError) {
        throw error;
      }

      throw new GitHubIntegrationError(
        'INSTALLATION_NOT_FOUND',
        'Failed to get installation info',
        false,
        { originalError: error }
      );
    }
  }
}
