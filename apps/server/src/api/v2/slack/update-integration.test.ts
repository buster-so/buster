import { getUserOrganizationId } from '@buster/database';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateIntegrationHandler } from './update-integration';

vi.mock('./services/slack-helpers', () => ({
  updateIntegrationSettings: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
}));

describe('updateIntegrationHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      get: vi.fn(),
      req: {
        json: vi.fn(),
      },
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should throw 401 when user is not authenticated', async () => {
    mockContext.get.mockReturnValue(null);

    await expect(updateIntegrationHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should throw 400 for invalid request body', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });
    mockContext.req.json.mockResolvedValue({ invalid: 'data' });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    await expect(updateIntegrationHandler(mockContext)).rejects.toThrow(HTTPException);
  });

  it('should successfully update integration settings', async () => {
    mockContext.get.mockReturnValue({ id: 'user-123' });
    mockContext.req.json.mockResolvedValue({
      default_channel: { id: 'C123', name: 'general' },
      default_sharing_permissions: 'public',
    });

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: 'org-123',
      role: 'owner',
    });

    const { updateIntegrationSettings } = await import('./services/slack-helpers');
    vi.mocked(updateIntegrationSettings).mockResolvedValue(undefined);

    await updateIntegrationHandler(mockContext);

    expect(updateIntegrationSettings).toHaveBeenCalledWith('org-123', {
      defaultChannel: { id: 'C123', name: 'general' },
      defaultSharingPermissions: 'public',
    });
    expect(mockContext.json).toHaveBeenCalledWith({
      message: 'Integration settings updated successfully',
    });
  });
});
