import { getUserOrganizationId } from '@buster/database';
import { SlackError } from '@buster/server-shared/slack';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlackHandler } from './handler';

// Mock @buster/secrets
vi.mock('@buster/secrets', () => ({
  getSecret: vi.fn().mockImplementation(async (key: string) => {
    const secrets: Record<string, string> = {
      BUSTER_URL: 'https://test.com',
      SLACK_CLIENT_ID: 'test-client-id',
      SLACK_CLIENT_SECRET: 'test-client-secret',
      SERVER_URL: 'https://test.com',
    };
    return secrets[key] || '';
  }),
  SERVER_KEYS: {
    DATABASE_URL: 'DATABASE_URL',
    SUPABASE_URL: 'SUPABASE_URL',
    SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
    ELECTRIC_PROXY_URL: 'ELECTRIC_PROXY_URL',
    ELECTRIC_SOURCE_ID: 'ELECTRIC_SOURCE_ID',
    ELECTRIC_SECRET: 'ELECTRIC_SECRET',
    TRIGGER_SECRET_KEY: 'TRIGGER_SECRET_KEY',
    SLACK_CLIENT_ID: 'SLACK_CLIENT_ID',
    SLACK_CLIENT_SECRET: 'SLACK_CLIENT_SECRET',
    SLACK_SIGNING_SECRET: 'SLACK_SIGNING_SECRET',
    SLACK_APP_SUPPORT_URL: 'SLACK_APP_SUPPORT_URL',
    SERVER_PORT: 'SERVER_PORT',
    SERVER_URL: 'SERVER_URL',
    BUSTER_URL: 'BUSTER_URL',
    ENVIRONMENT: 'ENVIRONMENT',
  },
  SLACK_KEYS: {
    SLACK_CLIENT_ID: 'SLACK_CLIENT_ID',
    SLACK_CLIENT_SECRET: 'SLACK_CLIENT_SECRET',
    SLACK_SIGNING_SECRET: 'SLACK_SIGNING_SECRET',
    SLACK_REDIRECT_URI: 'SLACK_REDIRECT_URI',
    SLACK_BOT_TOKEN: 'SLACK_BOT_TOKEN',
    SLACK_CHANNEL_ID: 'SLACK_CHANNEL_ID',
    SLACK_TEST_JOIN_CHANNEL_ID: 'SLACK_TEST_JOIN_CHANNEL_ID',
    SLACK_TEST_LEAVE_CHANNEL_ID: 'SLACK_TEST_LEAVE_CHANNEL_ID',
    SLACK_TEST_ACCESS_TOKEN: 'SLACK_TEST_ACCESS_TOKEN',
    SLACK_SKIP_DELETE_TESTS: 'SLACK_SKIP_DELETE_TESTS',
    SLACK_SKIP_LEAVE_TESTS: 'SLACK_SKIP_LEAVE_TESTS',
    SLACK_APP_SUPPORT_URL: 'SLACK_APP_SUPPORT_URL',
    BUSTER_ALERT_CHANNEL_TOKEN: 'BUSTER_ALERT_CHANNEL_TOKEN',
    BUSTER_ALERT_CHANNEL_ID: 'BUSTER_ALERT_CHANNEL_ID',
  },
}));

// Mock dependencies
const mockSlackOAuthService = {
  isEnabled: vi.fn(),
  initiateOAuth: vi.fn(),
  handleOAuthCallback: vi.fn(),
  getIntegrationStatus: vi.fn(),
  removeIntegration: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

// Mock getUserOrganizationId from database
vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('SlackHandler', () => {
  let handler: SlackHandler;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new SlackHandler();

    // Create mock context
    mockContext = {
      get: vi.fn(),
      req: {
        json: vi.fn(),
        query: vi.fn(),
        header: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
    };
  });

  describe('initiateOAuth', () => {
    it('should return 503 when integration is disabled', async () => {
      vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(false);

      await handler.initiateOAuth(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        {
          error: 'Slack integration is not enabled',
          code: 'INTEGRATION_DISABLED',
        },
        503
      );
    });

    it('should throw 401 when user is not authenticated', async () => {
      vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return null;
        if (key === 'organizationId') return 'org-123';
        return null;
      });

      await expect(handler.initiateOAuth(mockContext)).rejects.toThrow(HTTPException);
    });

    it('should successfully initiate OAuth flow', async () => {
      vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        return null;
      });
      mockContext.req.json.mockResolvedValue({
        metadata: { returnUrl: '/dashboard' },
      });
      mockContext.req.header.mockReturnValue('192.168.1.1');

      // Mock getUserOrganizationId to return org info
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      const mockResult = {
        authUrl: 'https://slack.com/oauth/authorize',
        state: 'test-state',
      };
      vi.mocked(mockSlackOAuthService.initiateOAuth).mockResolvedValue(mockResult);

      await handler.initiateOAuth(mockContext);

      expect(mockSlackOAuthService.initiateOAuth).toHaveBeenCalledWith({
        organizationId: 'org-123',
        userId: 'user-123',
        metadata: {
          ipAddress: '192.168.1.1',
        },
      });
      expect(mockContext.json).toHaveBeenCalledWith({
        auth_url: 'https://slack.com/oauth/authorize',
        state: 'test-state',
      });
    });

    it('should handle existing integration error', async () => {
      vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        return null;
      });
      mockContext.req.json.mockResolvedValue({});

      // Mock getUserOrganizationId to return org info
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      vi.mocked(mockSlackOAuthService.initiateOAuth).mockRejectedValue(
        new Error('Organization already has an active Slack integration')
      );

      await expect(handler.initiateOAuth(mockContext)).rejects.toThrow(SlackError);
    });
  });

  describe('handleOAuthCallback', () => {
    it('should redirect on user denial', async () => {
      mockContext.req.query.mockReturnValue({ error: 'access_denied' });

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith(
        'https://test.com/app/settings/integrations?status=cancelled'
      );
    });

    it('should redirect on invalid parameters', async () => {
      mockContext.req.query.mockReturnValue({ invalid: 'params' });

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith(
        'https://test.com/app/settings/integrations?status=error&error=invalid_parameters'
      );
    });

    it('should handle successful OAuth callback', async () => {
      mockContext.req.query.mockReturnValue({
        code: 'test-code',
        state: 'test-state',
      });

      const mockResult = {
        success: true,
        integrationId: 'integration-123',
        teamName: 'Test Workspace',
        metadata: { returnUrl: '/dashboard' },
      };
      vi.mocked(mockSlackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

      await handler.handleOAuthCallback(mockContext);

      expect(mockSlackOAuthService.handleOAuthCallback).toHaveBeenCalledWith({
        code: 'test-code',
        state: 'test-state',
      });
      expect(mockContext.redirect).toHaveBeenCalledWith(
        'https://test.com/dashboard?status=success&workspace=Test%20Workspace'
      );
    });

    it('should handle failed OAuth callback', async () => {
      mockContext.req.query.mockReturnValue({
        code: 'test-code',
        state: 'test-state',
      });

      const mockResult = {
        success: false,
        integrationId: '',
        error: 'invalid_state',
      };
      vi.mocked(mockSlackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith(
        'https://test.com/app/settings/integrations?status=error&error=invalid_state'
      );
    });
  });

  describe('getIntegration', () => {
    it('should throw 401 when user is not authenticated', async () => {
      mockContext.get.mockReturnValue(null);

      await expect(handler.getIntegration(mockContext)).rejects.toThrow(HTTPException);
    });

    it('should return integration status', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        return null;
      });

      // Mock getUserOrganizationId to return org info
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      const mockStatus = {
        connected: true,
        integration: {
          id: 'integration-123',
          team_name: undefined,
          installed_at: undefined,
          default_channel: undefined,
          default_sharing_permissions: undefined,
          last_used_at: undefined,
          team_domain: undefined,
        },
        status: undefined,
      };
      vi.mocked(mockSlackOAuthService.getIntegrationStatus).mockResolvedValue(mockStatus);

      await handler.getIntegration(mockContext);

      expect(mockSlackOAuthService.getIntegrationStatus).toHaveBeenCalledWith('org-123');
      expect(mockContext.json).toHaveBeenCalledWith(mockStatus);
    });
  });

  describe('removeIntegration', () => {
    it('should throw 401 when user is not authenticated', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return null;
        if (key === 'organizationId') return 'org-123';
        return null;
      });

      await expect(handler.removeIntegration(mockContext)).rejects.toThrow(HTTPException);
    });

    it('should successfully remove integration', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        return null;
      });

      // Mock getUserOrganizationId to return org info
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      vi.mocked(mockSlackOAuthService.removeIntegration).mockResolvedValue({
        success: true,
      });

      await handler.removeIntegration(mockContext);

      expect(mockSlackOAuthService.removeIntegration).toHaveBeenCalledWith('org-123', 'user-123');
      expect(mockContext.json).toHaveBeenCalledWith({
        message: 'Slack integration removed successfully',
      });
    });

    it('should handle integration not found error', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        return null;
      });

      // Mock getUserOrganizationId to return org info
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      vi.mocked(mockSlackOAuthService.removeIntegration).mockResolvedValue({
        success: false,
        error: 'No active Slack integration found',
      });

      await expect(handler.removeIntegration(mockContext)).rejects.toThrow(SlackError);
    });
  });
});
