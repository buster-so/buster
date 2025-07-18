import { getUserOrganizationId } from '@buster/database';
import { SlackError } from '@buster/server-shared/slack';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initiateOAuthHandler } from './initiate-oauth';

const mockSlackOAuthService = {
  isEnabled: vi.fn(),
  initiateOAuth: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('initiateOAuthHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      get: vi.fn(),
      req: {
        json: vi.fn(),
        header: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should return 503 when integration is disabled', async () => {
    vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(false);

    await initiateOAuthHandler(mockContext);

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
    mockContext.get.mockReturnValue(null);

    await expect(initiateOAuthHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should successfully initiate OAuth flow', async () => {
    vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(true);
    mockContext.get.mockReturnValue({ id: 'user-123' });
    mockContext.req.json.mockResolvedValue({
      metadata: { returnUrl: '/dashboard' },
    });
    mockContext.req.header.mockReturnValue('192.168.1.1');

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    const mockResult = {
      authUrl: 'https://slack.com/oauth/authorize',
      state: 'test-state',
    };
    vi.mocked(mockSlackOAuthService.initiateOAuth).mockResolvedValue(mockResult);

    await initiateOAuthHandler(mockContext);

    expect(mockSlackOAuthService.initiateOAuth).toHaveBeenCalledWith({
      organizationId: 'org-123',
      userId: 'user-123',
      metadata: {
        returnUrl: '/dashboard',
        ipAddress: '192.168.1.1',
      },
    });
    expect(mockContext.json).toHaveBeenCalledWith({
      auth_url: mockResult.authUrl,
      state: mockResult.state,
    });
  });

  it('should handle existing integration error', async () => {
    vi.mocked(mockSlackOAuthService.isEnabled).mockReturnValue(true);
    mockContext.get.mockReturnValue({ id: 'user-123' });
    mockContext.req.json.mockResolvedValue({});

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    vi.mocked(mockSlackOAuthService.initiateOAuth).mockRejectedValue(
      new Error('Organization already has an active Slack integration')
    );

    await expect(initiateOAuthHandler(mockContext)).rejects.toThrow(SlackError);
  });
});
