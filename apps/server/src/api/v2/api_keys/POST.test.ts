import type { User } from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiKeyHandler } from './POST';

// Mock dependencies
vi.mock('@buster/database/queries', () => ({
  createApiKey: vi.fn(),
  getUserOrganizationId: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(),
}));

const { createApiKey, getUserOrganizationId } = await import('@buster/database/queries');
const { sign } = await import('jsonwebtoken');

describe('createApiKeyHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
    avatarUrl: null,
    attributes: null,
    config: null,
  };

  const mockRequest = { name: 'Test API Key' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should successfully create an API key', async () => {
    const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    const mockOrgId = 'org-123';

    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: mockOrgId,
      role: 'workspace_admin',
    });

    vi.mocked(sign).mockReturnValue(mockJwtToken);

    vi.mocked(createApiKey).mockResolvedValue('api-key-id-123');

    const result = await createApiKeyHandler(mockRequest, mockUser);

    expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
    expect(sign).toHaveBeenCalledWith(
      expect.objectContaining({
        aud: 'api',
        sub: mockUser.id,
        exp: expect.any(Number),
      }),
      'test-secret',
      { algorithm: 'HS256' }
    );
    expect(createApiKey).toHaveBeenCalledWith({
      ownerId: mockUser.id,
      key: mockJwtToken,
      organizationId: mockOrgId,
    });
    expect(result).toEqual({
      api_key: mockJwtToken,
    });
  });

  it('should throw 500 error if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;

    await expect(createApiKeyHandler(mockRequest, mockUser)).rejects.toThrow(HTTPException);

    try {
      await createApiKeyHandler(mockRequest, mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      expect((error as HTTPException).status).toBe(500);
      expect((error as HTTPException).message).toBe('Server configuration error');
    }

    expect(getUserOrganizationId).not.toHaveBeenCalled();
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it('should throw 403 error if user is not associated with an organization', async () => {
    vi.mocked(getUserOrganizationId).mockResolvedValue(null);

    await expect(createApiKeyHandler(mockRequest, mockUser)).rejects.toThrow(HTTPException);

    try {
      await createApiKeyHandler(mockRequest, mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      expect((error as HTTPException).status).toBe(403);
      expect((error as HTTPException).message).toBe('User is not associated with an organization');
    }

    expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
    expect(sign).not.toHaveBeenCalled();
    expect(createApiKey).not.toHaveBeenCalled();
  });
});

