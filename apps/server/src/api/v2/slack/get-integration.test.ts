import { getUserOrganizationId } from '@buster/database';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getIntegrationHandler } from './get-integration';

const mockSlackOAuthService = {
  getIntegrationStatus: vi.fn(),
};

vi.mock('./services/slack-oauth-service', () => ({
  createSlackOAuthService: vi.fn(() => mockSlackOAuthService),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('getIntegrationHandler', () => {
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

    await expect(getIntegrationHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should return integration status', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    const mockStatus = {
      connected: true,
      integration: {
        id: 'integration-123',
        teamName: 'Test Workspace',
        installedAt: '2025-01-01T00:00:00.000Z',
      },
    };
    vi.mocked(mockSlackOAuthService.getIntegrationStatus).mockResolvedValue(mockStatus);

    await getIntegrationHandler(mockContext);

    expect(mockSlackOAuthService.getIntegrationStatus).toHaveBeenCalledWith('org-123');
    expect(mockContext.json).toHaveBeenCalledWith({
      connected: true,
      integration: {
        id: 'integration-123',
        team_name: 'Test Workspace',
        team_domain: undefined,
        installed_at: '2025-01-01T00:00:00.000Z',
        last_used_at: undefined,
        default_channel: undefined,
        default_sharing_permissions: undefined,
      },
    });
  });
});
