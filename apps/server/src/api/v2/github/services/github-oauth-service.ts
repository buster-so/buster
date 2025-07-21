import { GitHubAuthService } from '@buster/github';
import { z } from 'zod';
import { GITHUB_OAUTH_SCOPES } from '../constants';
import * as githubHelpers from './github-helpers';
import { oauthStateStorage, tokenStorage } from './token-storage';

function validateScopes(currentScopeString?: string | null): boolean {
  if (!currentScopeString) return false;

  const currentScopes = currentScopeString.includes(',')
    ? currentScopeString.split(',').map((s) => s.trim())
    : currentScopeString.split(' ').map((s) => s.trim());

  const requiredScopes = [...GITHUB_OAUTH_SCOPES];
  return requiredScopes.every((scope) => currentScopes.includes(scope));
}

const GitHubEnvSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  SERVER_URL: z.string().url(),
  GITHUB_INTEGRATION_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

const OAuthMetadataSchema = z.object({
  returnUrl: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().uuid().optional(),
  initiatedAt: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

export type OAuthMetadata = z.infer<typeof OAuthMetadataSchema>;

export class GitHubOAuthService {
  private githubAuth: GitHubAuthService;
  private env: z.infer<typeof GitHubEnvSchema>;

  constructor() {
    try {
      this.env = GitHubEnvSchema.parse(process.env);

      this.githubAuth = new GitHubAuthService(
        {
          clientId: this.env.GITHUB_CLIENT_ID,
          clientSecret: this.env.GITHUB_CLIENT_SECRET,
          redirectUri: `${this.env.SERVER_URL}/api/v2/github/auth/callback`,
          scopes: [...GITHUB_OAUTH_SCOPES],
        },
        tokenStorage,
        oauthStateStorage
      );
    } catch (error) {
      console.error('Failed to initialize GitHubOAuthService:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
        environment: {
          hasClientId: !!process.env.GITHUB_CLIENT_ID,
          hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
          hasServerUrl: !!process.env.SERVER_URL,
          integrationEnabled: process.env.GITHUB_INTEGRATION_ENABLED,
        },
      });
      throw new Error(
        `Failed to initialize GitHub OAuth service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  isEnabled(): boolean {
    return this.env.GITHUB_INTEGRATION_ENABLED;
  }

  async initiateOAuth(params: {
    organizationId: string;
    userId: string;
    metadata?: OAuthMetadata;
  }): Promise<{ authUrl: string; state: string }> {
    try {
      if (!this.isEnabled()) {
        throw new Error('GitHub integration is not enabled');
      }

      const existing = await githubHelpers.getActiveIntegration(params.organizationId);
      if (existing) {
        throw new Error(
          'Organization already has an active GitHub integration'
        );
      }

      const metadata = {
        ...params.metadata,
        initiatedAt: new Date().toISOString(),
      };

      const { authUrl, state } = await this.githubAuth.generateAuthUrl(metadata);

      await githubHelpers.createPendingIntegration({
        organizationId: params.organizationId,
        userId: params.userId,
        oauthState: state,
        oauthMetadata: metadata,
      });

      return { authUrl, state };
    } catch (error) {
      console.error('Failed to initiate OAuth:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        organizationId: params.organizationId,
        userId: params.userId,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
        integrationEnabled: this.isEnabled(),
      });
      throw error;
    }
  }

  async handleOAuthCallback(params: {
    code: string;
    state: string;
  }): Promise<{
    success: boolean;
    integrationId: string;
    metadata?: OAuthMetadata;
    orgName?: string;
    error?: string;
  }> {
    try {
      const integration = await githubHelpers.getPendingIntegrationByState(params.state);
      if (!integration) {
        return {
          success: false,
          integrationId: '',
          error: 'Invalid or expired OAuth state',
        };
      }

      const tokenKey = `github-token-${integration.id}`;
      const tokenResponse = await this.githubAuth.handleCallback(
        params.code,
        params.state,
        tokenKey
      );

      const updateParams: Parameters<typeof githubHelpers.updateIntegrationAfterOAuth>[1] = {
        installationId: tokenResponse.installationId,
        appId: tokenResponse.appId || undefined,
        githubOrgId: tokenResponse.githubOrgId,
        githubOrgName: tokenResponse.githubOrgName || undefined,
        tokenVaultKey: tokenKey,
        repositoryPermissions: tokenResponse.repositoryPermissions || undefined,
      };

      await githubHelpers.updateIntegrationAfterOAuth(integration.id, updateParams);

      return {
        success: true,
        integrationId: integration.id,
        metadata: {} as OAuthMetadata,
        orgName: tokenResponse.githubOrgName || undefined,
      };
    } catch (error) {
      console.error('OAuth callback error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: params.code ? '[REDACTED]' : 'missing',
        state: params.state ? `${params.state.substring(0, 8)}...` : 'missing',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      let integrationId = '';
      try {
        const integration = await githubHelpers.getPendingIntegrationByState(params.state);
        if (integration) {
          integrationId = integration.id;
          await githubHelpers.markIntegrationAsFailed(
            integration.id,
            error instanceof Error ? error.message : 'Unknown error'
          );
          return {
            success: false,
            integrationId: integration.id,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup after OAuth error:', {
          originalError: error instanceof Error ? error.message : String(error),
          cleanupError: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          state: params.state ? `${params.state.substring(0, 8)}...` : 'missing',
        });
      }

      return {
        success: false,
        integrationId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getIntegrationStatus(organizationId: string): Promise<{
    connected: boolean;
    status?: 'connected' | 'disconnected' | 're_install_required';
    integration?: {
      id: string;
      orgName: string;
      installedAt: string;
      lastUsedAt?: string;
      repositoryPermissions?: Record<string, unknown>;
    };
  }> {
    try {
      const integration = await githubHelpers.getActiveIntegration(organizationId);

      if (!integration) {
        return { connected: false, status: 'disconnected' };
      }


      return {
        connected: true,
        status: 'connected',
        integration: {
          id: integration.id,
          orgName: integration.githubOrgName || '',
          installedAt: integration.installedAt || integration.createdAt,
          ...(integration.lastUsedAt != null && { lastUsedAt: integration.lastUsedAt }),
          repositoryPermissions: integration.repositoryPermissions as Record<string, unknown>,
        },
      };
    } catch (error) {
      console.error('Failed to get integration status:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        organizationId,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async removeIntegration(
    organizationId: string,
    _userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await githubHelpers.getActiveIntegration(organizationId);

      if (!integration) {
        return {
          success: false,
          error: 'No active GitHub integration found',
        };
      }

      if (integration.tokenVaultKey) {
        try {
          await tokenStorage.deleteToken(integration.tokenVaultKey);
        } catch (error) {
          console.error('Failed to delete token from vault:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            tokenVaultKey: integration.tokenVaultKey,
            integrationId: integration.id,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            timestamp: new Date().toISOString(),
          });
        }
      }

      await githubHelpers.softDeleteIntegration(integration.id);

      return { success: true };
    } catch (error) {
      console.error('Failed to remove integration:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        organizationId,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove integration',
      };
    }
  }

  async getTokenFromVault(integrationId: string): Promise<string | null> {
    try {
      const integration = await githubHelpers.getIntegrationById(integrationId);
      if (!integration || !integration.tokenVaultKey) {
        return null;
      }

      return await tokenStorage.getToken(integration.tokenVaultKey);
    } catch (error) {
      console.error('Failed to get token from vault:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        integrationId,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }
}

export function createGitHubOAuthService(): GitHubOAuthService {
  return new GitHubOAuthService();
}
