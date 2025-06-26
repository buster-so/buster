import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlackError, SlackHandler } from './handler';
import { slackOAuthService } from './services/slack-oauth-service';

// Mock dependencies
vi.mock('./services/slack-oauth-service', () => ({
  slackOAuthService: {
    isEnabled: vi.fn(),
    initiateOAuth: vi.fn(),
    handleOAuthCallback: vi.fn(),
    getIntegrationStatus: vi.fn(),
    removeIntegration: vi.fn(),
  },
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
      vi.mocked(slackOAuthService.isEnabled).mockReturnValue(false);

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
      vi.mocked(slackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return null;
        if (key === 'organizationId') return 'org-123';
        return null;
      });

      await expect(handler.initiateOAuth(mockContext)).rejects.toThrow(HTTPException);
    });

    it('should successfully initiate OAuth flow', async () => {
      vi.mocked(slackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        if (key === 'organizationId') return 'org-123';
        return null;
      });
      mockContext.req.json.mockResolvedValue({
        metadata: { returnUrl: '/dashboard' },
      });
      mockContext.req.header.mockReturnValue('192.168.1.1');

      const mockResult = {
        authUrl: 'https://slack.com/oauth/authorize',
        state: 'test-state',
      };
      vi.mocked(slackOAuthService.initiateOAuth).mockResolvedValue(mockResult);

      await handler.initiateOAuth(mockContext);

      expect(slackOAuthService.initiateOAuth).toHaveBeenCalledWith({
        organizationId: 'org-123',
        userId: 'user-123',
        metadata: {
          returnUrl: '/dashboard',
          ipAddress: '192.168.1.1',
        },
      });
      expect(mockContext.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle existing integration error', async () => {
      vi.mocked(slackOAuthService.isEnabled).mockReturnValue(true);
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        if (key === 'organizationId') return 'org-123';
        return null;
      });
      mockContext.req.json.mockResolvedValue({});

      vi.mocked(slackOAuthService.initiateOAuth).mockRejectedValue(
        new Error('Organization already has an active Slack integration')
      );

      await expect(handler.initiateOAuth(mockContext)).rejects.toThrow(SlackError);
    });
  });

  describe('handleOAuthCallback', () => {
    it('should redirect on user denial', async () => {
      mockContext.req.query.mockReturnValue({ error: 'access_denied' });

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith('/settings/integrations?status=cancelled');
    });

    it('should redirect on invalid parameters', async () => {
      mockContext.req.query.mockReturnValue({ invalid: 'params' });

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith(
        '/settings/integrations?status=error&error=invalid_parameters'
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
      vi.mocked(slackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

      await handler.handleOAuthCallback(mockContext);

      expect(slackOAuthService.handleOAuthCallback).toHaveBeenCalledWith({
        code: 'test-code',
        state: 'test-state',
      });
      expect(mockContext.redirect).toHaveBeenCalledWith(
        '/dashboard?status=success&workspace=Test%20Workspace'
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
      vi.mocked(slackOAuthService.handleOAuthCallback).mockResolvedValue(mockResult);

      await handler.handleOAuthCallback(mockContext);

      expect(mockContext.redirect).toHaveBeenCalledWith(
        '/settings/integrations?status=error&error=invalid_state'
      );
    });
  });

  describe('getIntegration', () => {
    it('should throw 400 when organization context is missing', async () => {
      mockContext.get.mockReturnValue(null);

      await expect(handler.getIntegration(mockContext)).rejects.toThrow(HTTPException);
    });

    it('should return integration status', async () => {
      mockContext.get.mockReturnValue('org-123');

      const mockStatus = {
        connected: true,
        integration: {
          id: 'integration-123',
          teamName: 'Test Workspace',
          installedAt: '2025-01-01T00:00:00.000Z',
        },
      };
      vi.mocked(slackOAuthService.getIntegrationStatus).mockResolvedValue(mockStatus);

      await handler.getIntegration(mockContext);

      expect(slackOAuthService.getIntegrationStatus).toHaveBeenCalledWith('org-123');
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
        if (key === 'organizationId') return 'org-123';
        return null;
      });

      vi.mocked(slackOAuthService.removeIntegration).mockResolvedValue({
        success: true,
      });

      await handler.removeIntegration(mockContext);

      expect(slackOAuthService.removeIntegration).toHaveBeenCalledWith('org-123', 'user-123');
      expect(mockContext.json).toHaveBeenCalledWith({
        message: 'Slack integration removed successfully',
      });
    });

    it('should handle integration not found error', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'busterUser') return { id: 'user-123' };
        if (key === 'organizationId') return 'org-123';
        return null;
      });

      vi.mocked(slackOAuthService.removeIntegration).mockResolvedValue({
        success: false,
        error: 'No active Slack integration found',
      });

      await expect(handler.removeIntegration(mockContext)).rejects.toThrow(SlackError);
    });
  });
});
