import { SlackAuthService } from '@buster/slack';
import { z } from 'zod';
import { SLACK_OAUTH_SCOPES } from '../constants';
import * as slackHelpers from './slack-helpers';
import { oauthStateStorage, tokenStorage } from './token-storage';

/**
 * Validates if an integration has all required OAuth scopes
 */
function validateScopes(currentScopeString?: string | null): boolean {
  if (!currentScopeString) return false;

  const currentScopes = currentScopeString.includes(',')
    ? currentScopeString.split(',').map((s) => s.trim())
    : currentScopeString.split(' ').map((s) => s.trim());

  const requiredScopes = [...SLACK_OAUTH_SCOPES];
  return requiredScopes.every((scope) => currentScopes.includes(scope));
}

// Environment validation
const SlackEnvSchema = z.object({
  SLACK_CLIENT_ID: z.string().min(1),
  SLACK_CLIENT_SECRET: z.string().min(1),
  SERVER_URL: z.string().url(),
  SLACK_INTEGRATION_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

// OAuth metadata schema
const OAuthMetadataSchema = z.object({
  returnUrl: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().uuid().optional(),
  initiatedAt: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

export type OAuthMetadata = z.infer<typeof OAuthMetadataSchema>;

export class SlackOAuthService {
  private slackAuth: SlackAuthService;
  private env: z.infer<typeof SlackEnvSchema>;

  constructor() {
    try {
      // Validate environment variables
      this.env = SlackEnvSchema.parse(process.env);

      // Initialize Slack auth service with storage implementations
      this.slackAuth = new SlackAuthService(
        {
          clientId: this.env.SLACK_CLIENT_ID,
          clientSecret: this.env.SLACK_CLIENT_SECRET,
          redirectUri: `${this.env.SERVER_URL}/api/v2/slack/auth/callback`,
          scopes: [...SLACK_OAUTH_SCOPES],
        },
        tokenStorage,
        oauthStateStorage
      );
    } catch (error) {
      console.error('Failed to initialize SlackOAuthService:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
        environment: {
          hasClientId: !!process.env.SLACK_CLIENT_ID,
          hasClientSecret: !!process.env.SLACK_CLIENT_SECRET,
          hasServerUrl: !!process.env.SERVER_URL,
          integrationEnabled: process.env.SLACK_INTEGRATION_ENABLED,
        },
      });
      throw new Error(
        `Failed to initialize Slack OAuth service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if Slack integration is enabled
   */
  isEnabled(): boolean {
    return this.env.SLACK_INTEGRATION_ENABLED;
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(params: {
    organizationId: string;
    userId: string;
    metadata?: OAuthMetadata;
  }): Promise<{ authUrl: string; state: string }> {
    try {
      // Check if integration is enabled
      if (!this.isEnabled()) {
        throw new Error('Slack integration is not enabled');
      }

      // Check for existing integration - allow re-installation if scopes don't match
      const existing = await slackHelpers.getActiveIntegration(params.organizationId);
      if (existing) {
        if (validateScopes(existing.scope)) {
          throw new Error(
            'Organization already has an active Slack integration with current scopes'
          );
        }
      }

      // Add system metadata
      const metadata = {
        ...params.metadata,
        initiatedAt: new Date().toISOString(),
      };

      // Generate OAuth URL and state
      const { authUrl, state } = await this.slackAuth.generateAuthUrl(metadata);

      // Create pending integration
      await slackHelpers.createPendingIntegration({
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
      throw error; // Re-throw to maintain existing error handling in handler
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(params: {
    code: string;
    state: string;
  }): Promise<{
    success: boolean;
    integrationId: string;
    metadata?: OAuthMetadata;
    teamName?: string;
    error?: string;
  }> {
    try {
      // Validate state and get pending integration
      const integration = await slackHelpers.getPendingIntegrationByState(params.state);
      if (!integration) {
        return {
          success: false,
          integrationId: '',
          error: 'Invalid or expired OAuth state',
        };
      }

      // Exchange code for token - use integration.id as tokenKey
      const tokenKey = `slack-token-${integration.id}`;
      const tokenResponse = await this.slackAuth.handleCallback(
        params.code,
        params.state,
        tokenKey
      );

      // Store token vault key and update integration
      const updateParams: Parameters<typeof slackHelpers.updateIntegrationAfterOAuth>[1] = {
        teamId: tokenResponse.teamId,
        teamName: tokenResponse.teamName,
        botUserId: tokenResponse.botUserId,
        scope: tokenResponse.scope,
        tokenVaultKey: tokenKey,
      };

      // Add optional properties only if they exist
      if (tokenResponse.teamDomain !== undefined) {
        updateParams.teamDomain = tokenResponse.teamDomain;
      }
      if (tokenResponse.enterpriseId !== undefined) {
        updateParams.enterpriseId = tokenResponse.enterpriseId;
      }
      if (tokenResponse.installerUserId !== undefined) {
        updateParams.installedBySlackUserId = tokenResponse.installerUserId;
      }

      await slackHelpers.updateIntegrationAfterOAuth(integration.id, updateParams);

      return {
        success: true,
        integrationId: integration.id,
        metadata: integration.oauthMetadata as OAuthMetadata,
        teamName: tokenResponse.teamName,
      };
    } catch (error) {
      // Enhanced error logging with structured data
      console.error('OAuth callback error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: params.code ? '[REDACTED]' : 'missing', // Don't log sensitive data
        state: params.state ? `${params.state.substring(0, 8)}...` : 'missing', // Partial state for debugging
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
      });

      // Try to get integration for cleanup
      let integrationId = '';
      try {
        const integration = await slackHelpers.getPendingIntegrationByState(params.state);
        if (integration) {
          integrationId = integration.id;
          await slackHelpers.markIntegrationAsFailed(
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

  /**
   * Get integration status
   */
  async getIntegrationStatus(organizationId: string): Promise<{
    connected: boolean;
    status?: 'connected' | 'disconnected' | 're_install_required';
    integration?: {
      id: string;
      teamName: string;
      teamDomain?: string;
      installedAt: string;
      lastUsedAt?: string;
      defaultChannel?: {
        id: string;
        name: string;
      };
      defaultSharingPermissions?: string;
    };
  }> {
    try {
      const integration = await slackHelpers.getActiveIntegration(organizationId);

      if (!integration) {
        return { connected: false, status: 'disconnected' };
      }

      // Validate scopes
      if (!validateScopes(integration.scope)) {
        // Cast defaultChannel to the expected type
        const defaultChannel = integration.defaultChannel as
          | { id: string; name: string }
          | Record<string, never>
          | null;

        // Check if defaultChannel has content
        const hasDefaultChannel =
          defaultChannel &&
          typeof defaultChannel === 'object' &&
          'id' in defaultChannel &&
          'name' in defaultChannel;

        return {
          connected: true,
          status: 're_install_required',
          integration: {
            id: integration.id,
            teamName: integration.teamName || '',
            ...(integration.teamDomain != null && { teamDomain: integration.teamDomain }),
            installedAt: integration.installedAt || integration.createdAt,
            ...(integration.lastUsedAt != null && { lastUsedAt: integration.lastUsedAt }),
            ...(hasDefaultChannel && {
              defaultChannel: {
                id: defaultChannel.id,
                name: defaultChannel.name,
              },
            }),
            defaultSharingPermissions: integration.defaultSharingPermissions,
          },
        };
      }

      // Cast defaultChannel to the expected type
      const defaultChannel = integration.defaultChannel as
        | { id: string; name: string }
        | Record<string, never>
        | null;

      // Check if defaultChannel has content
      const hasDefaultChannel =
        defaultChannel &&
        typeof defaultChannel === 'object' &&
        'id' in defaultChannel &&
        'name' in defaultChannel;

      return {
        connected: true,
        status: 'connected',
        integration: {
          id: integration.id,
          teamName: integration.teamName || '',
          ...(integration.teamDomain != null && { teamDomain: integration.teamDomain }),
          installedAt: integration.installedAt || integration.createdAt,
          ...(integration.lastUsedAt != null && { lastUsedAt: integration.lastUsedAt }),
          ...(hasDefaultChannel && {
            defaultChannel: {
              id: defaultChannel.id,
              name: defaultChannel.name,
            },
          }),
          defaultSharingPermissions: integration.defaultSharingPermissions,
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

  /**
   * Remove integration
   */
  async removeIntegration(
    organizationId: string,
    _userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await slackHelpers.getActiveIntegration(organizationId);

      if (!integration) {
        return {
          success: false,
          error: 'No active Slack integration found',
        };
      }

      // Revoke token from vault
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
          // Continue with integration removal even if token deletion fails
        }
      }

      // Soft delete integration
      await slackHelpers.softDeleteIntegration(integration.id);

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

  /**
   * Get token from vault
   */
  async getTokenFromVault(integrationId: string): Promise<string | null> {
    try {
      const integration = await slackHelpers.getIntegrationById(integrationId);
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

// Factory function for creating service instances
export function createSlackOAuthService(): SlackOAuthService {
  return new SlackOAuthService();
}
