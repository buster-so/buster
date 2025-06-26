import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as slackHelpers from './slack-helpers';

// Mock dependencies
vi.mock('./slack-helpers');
vi.mock('@buster/slack', () => ({
  SlackAuthService: vi.fn().mockImplementation(() => ({
    generateAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
  })),
}));

// Mock environment variables before importing
vi.stubEnv('SLACK_CLIENT_ID', 'test-client-id');
vi.stubEnv('SLACK_CLIENT_SECRET', 'test-client-secret');
vi.stubEnv('SLACK_REDIRECT_URI', 'https://test.com/callback');
vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'true');

// Import after mocking env vars
import { SlackOAuthService } from './slack-oauth-service';

describe('SlackOAuthService', () => {
  let service: SlackOAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars to defaults
    vi.stubEnv('SLACK_CLIENT_ID', 'test-client-id');
    vi.stubEnv('SLACK_CLIENT_SECRET', 'test-client-secret');
    vi.stubEnv('SLACK_REDIRECT_URI', 'https://test.com/callback');
    vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'true');
    service = new SlackOAuthService();
  });

  describe('isEnabled', () => {
    it('should return true when integration is enabled', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should return false when integration is disabled', () => {
      vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'false');
      const disabledService = new SlackOAuthService();
      expect(disabledService.isEnabled()).toBe(false);
    });
  });

  describe('initiateOAuth', () => {
    it('should throw error when integration is disabled', async () => {
      vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'false');
      const disabledService = new SlackOAuthService();

      await expect(
        disabledService.initiateOAuth({
          organizationId: 'org-123',
          userId: 'user-123',
        })
      ).rejects.toThrow('Slack integration is not enabled');
    });

    it('should throw error when active integration exists', async () => {
      // Ensure integration is enabled for this test
      vi.stubEnv('SLACK_INTEGRATION_ENABLED', 'true');
      const enabledService = new SlackOAuthService();
      
      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue({
        id: 'existing-integration',
        organizationId: 'org-123',
        status: 'active',
      } as any);

      await expect(
        enabledService.initiateOAuth({
          organizationId: 'org-123',
          userId: 'user-123',
        })
      ).rejects.toThrow('Organization already has an active Slack integration');
    });

    it('should create pending integration and return auth URL', async () => {
      const mockAuthUrl = 'https://slack.com/oauth/authorize';
      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue(null);
      vi.mocked(slackHelpers.createPendingIntegration).mockResolvedValue('integration-123');

      // Mock the slackAuth instance
      const mockGenerateAuthUrl = vi.fn().mockResolvedValue({
        authUrl: mockAuthUrl,
        state: 'mocked-state-1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      });
      (service as any).slackAuth = {
        generateAuthUrl: mockGenerateAuthUrl,
      };

      const result = await service.initiateOAuth({
        organizationId: 'org-123',
        userId: 'user-123',
        metadata: {
          returnUrl: '/dashboard',
          source: 'settings',
        },
      });

      expect(result.authUrl).toBe(mockAuthUrl);
      expect(result.state).toBe('mocked-state-1234567890abcdef1234567890abcdef1234567890abcdef1234567890');

      expect(slackHelpers.createPendingIntegration).toHaveBeenCalledWith({
        organizationId: 'org-123',
        userId: 'user-123',
        oauthState: result.state,
        oauthMetadata: expect.objectContaining({
          returnUrl: '/dashboard',
          source: 'settings',
          initiatedAt: expect.any(String),
        }),
      });

      expect(mockGenerateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({
        returnUrl: '/dashboard',
        source: 'settings',
        initiatedAt: expect.any(String),
      }));
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return not connected when no integration exists', async () => {
      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue(null);

      const result = await service.getIntegrationStatus('org-123');

      expect(result.connected).toBe(false);
      expect(result.integration).toBeUndefined();
    });

    it('should return integration details when active integration exists', async () => {
      const mockIntegration = {
        id: 'integration-123',
        organizationId: 'org-123',
        teamName: 'Test Workspace',
        teamDomain: 'test-workspace',
        installedAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        status: 'active',
      };

      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue(mockIntegration as any);

      const result = await service.getIntegrationStatus('org-123');

      expect(result.connected).toBe(true);
      expect(result.integration).toEqual({
        id: 'integration-123',
        teamName: 'Test Workspace',
        teamDomain: 'test-workspace',
        installedAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-15T00:00:00Z',
      });
    });
  });

  describe('removeIntegration', () => {
    it('should return error when no integration exists', async () => {
      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue(null);

      const result = await service.removeIntegration('org-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active Slack integration found');
    });

    it('should successfully remove integration', async () => {
      const mockIntegration = {
        id: 'integration-123',
        organizationId: 'org-123',
        tokenVaultKey: 'slack-token-123',
        status: 'active',
      };

      vi.mocked(slackHelpers.getActiveIntegration).mockResolvedValue(mockIntegration as any);
      vi.mocked(slackHelpers.softDeleteIntegration).mockResolvedValue();

      // Mock token storage
      const mockDeleteToken = vi.fn().mockResolvedValue(undefined);
      (service as any).tokenStorage = { deleteToken: mockDeleteToken };

      const result = await service.removeIntegration('org-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(slackHelpers.softDeleteIntegration).toHaveBeenCalledWith('integration-123');
    });
  });
});
