import { SlackAuthService } from '@buster/slack';
import { z } from 'zod';
import * as slackHelpers from './slack-helpers';
import { oauthStateStorage, tokenStorage } from './token-storage';

// Environment validation
const SlackEnvSchema = z.object({
  SLACK_CLIENT_ID: z.string().min(1),
  SLACK_CLIENT_SECRET: z.string().min(1),
  SLACK_REDIRECT_URI: z.string().url(),
  SLACK_INTEGRATION_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
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
          redirectUri: this.env.SLACK_REDIRECT_URI,
          scopes: [
            'channels:read',
            'chat:write',
            'chat:write.public',
            'channels:join',
            'users:read',
          ],
        },
        tokenStorage,
        oauthStateStorage
      );
    } catch (error) {
      console.error('Failed to initialize SlackOAuthService:', error);
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

      // Check for existing integration
      const existing = await slackHelpers.getActiveIntegration(params.organizationId);
      if (existing) {
        throw new Error('Organization already has an active Slack integration');
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
      console.error('Failed to initiate OAuth:', error);
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
      console.error('OAuth callback error:', error);

      // Try to get integration for cleanup
      const integration = await slackHelpers.getPendingIntegrationByState(params.state);
      if (integration) {
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

      return {
        success: false,
        integrationId: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(organizationId: string): Promise<{
    connected: boolean;
    integration?: {
      id: string;
      teamName: string;
      teamDomain?: string;
      installedAt: string;
      lastUsedAt?: string;
    };
  }> {
    try {
      const integration = await slackHelpers.getActiveIntegration(organizationId);

      if (!integration) {
        return { connected: false };
      }

      return {
        connected: true,
        integration: {
          id: integration.id,
          teamName: integration.teamName || '',
          ...(integration.teamDomain != null && { teamDomain: integration.teamDomain }),
          installedAt: integration.installedAt || integration.createdAt,
          ...(integration.lastUsedAt != null && { lastUsedAt: integration.lastUsedAt }),
        },
      };
    } catch (error) {
      console.error('Failed to get integration status:', error);
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
          console.error('Failed to delete token from vault:', error);
          // Continue with integration removal even if token deletion fails
        }
      }

      // Soft delete integration
      await slackHelpers.softDeleteIntegration(integration.id);

      return { success: true };
    } catch (error) {
      console.error('Failed to remove integration:', error);
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
      console.error('Failed to get token from vault:', error);
      return null;
    }
  }
}

// Factory function for creating service instances
export function createSlackOAuthService(): SlackOAuthService {
  return new SlackOAuthService();
}
