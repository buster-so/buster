import { getUserOrganizationId } from '@buster/database';
import { SlackError } from '@buster/server-shared/slack';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeIntegrationHandler } from './remove-integration';

const mockSlackOAuthService = {
  removeIntegration: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('removeIntegrationHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      get: vi.fn(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should throw 401 when user is not authenticated', async () => {
    mockContext.get.mockReturnValue(null);

    await expect(removeIntegrationHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should successfully remove integration', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    vi.mocked(mockSlackOAuthService.removeIntegration).mockResolvedValue({
      success: true,
    });

    await removeIntegrationHandler(mockContext);

    expect(mockSlackOAuthService.removeIntegration).toHaveBeenCalledWith('org-123', 'user-123');
    expect(mockContext.json).toHaveBeenCalledWith({
      message: 'Slack integration removed successfully',
    });
  });

  it('should handle integration not found error', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    vi.mocked(mockSlackOAuthService.removeIntegration).mockResolvedValue({
      success: false,
      error: 'No active Slack integration found',
    });

    await expect(removeIntegrationHandler(mockContext)).rejects.toThrow(SlackError);
  });
});
