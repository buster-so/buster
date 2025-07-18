import { getUserOrganizationId } from '@buster/database';
import { SlackError } from '@buster/server-shared/slack';
import { SlackChannelService } from '@buster/slack';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChannelsHandler } from './get-channels';

const mockSlackOAuthService = {
  getIntegrationStatus: vi.fn(),
  getTokenFromVault: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

vi.mock('@buster/slack', () => ({
  SlackChannelService: vi.fn().mockImplementation(() => ({
    getAvailableChannels: vi.fn(),
  })),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('getChannelsHandler', () => {
  let mockContext: any;
  let mockChannelService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      get: vi.fn(),
      json: vi.fn().mockReturnThis(),
    };

    mockChannelService = {
      getAvailableChannels: vi.fn(),
    };
    vi.mocked(SlackChannelService).mockImplementation(() => mockChannelService);
  });

  it('should throw 401 when user is not authenticated', async () => {
    mockContext.get.mockReturnValue(null);

    await expect(getChannelsHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should throw error when no integration found', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    vi.mocked(mockSlackOAuthService.getIntegrationStatus).mockResolvedValue({
      connected: false,
    });

    await expect(getChannelsHandler(mockContext)).rejects.toThrow(SlackError);
  });

  it('should successfully get channels', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    vi.mocked(mockSlackOAuthService.getIntegrationStatus).mockResolvedValue({
      connected: true,
      integration: { id: 'integration-123' },
    });

    vi.mocked(mockSlackOAuthService.getTokenFromVault).mockResolvedValue('token-123');

    const mockChannels = [
      {
        id: 'C123',
        name: 'general',
        is_private: false,
        is_archived: false,
        is_member: true,
      },
    ];
    mockChannelService.getAvailableChannels.mockResolvedValue(mockChannels);

    await getChannelsHandler(mockContext);

    expect(mockChannelService.getAvailableChannels).toHaveBeenCalledWith('token-123');
    expect(mockContext.json).toHaveBeenCalledWith({
      channels: mockChannels,
    });
  });
});
