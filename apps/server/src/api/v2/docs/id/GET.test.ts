import type { User } from '@buster/database/queries';
import { getDoc, getUserOrganizationId } from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { getDocHandler } from './GET';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');

describe('getDocHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  const mockDoc = {
    id: 'doc-123',
    name: 'Test Doc',
    content: 'Test content',
    type: 'normal' as const,
    organizationId: 'org-123',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (getUserOrganizationId as Mock).mockResolvedValue({
      organizationId: 'org-123',
      role: 'member',
    });
  });

  it('should retrieve a doc successfully', async () => {
    (getDoc as Mock).mockResolvedValue(mockDoc);

    const result = await getDocHandler('doc-123', mockUser);

    expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
    expect(getDoc).toHaveBeenCalledWith({
      id: 'doc-123',
      organizationId: 'org-123',
    });
    expect(result).toEqual(mockDoc);
  });

  it('should throw 404 if doc not found', async () => {
    (getDoc as Mock).mockResolvedValue(null);

    await expect(getDocHandler('doc-123', mockUser)).rejects.toThrow(HTTPException);
    await expect(getDocHandler('doc-123', mockUser)).rejects.toThrow('Document not found');
  });

  it('should throw 403 if user is not associated with an organization', async () => {
    (getUserOrganizationId as Mock).mockResolvedValue(null);

    await expect(getDocHandler('doc-123', mockUser)).rejects.toThrow(HTTPException);
    await expect(getDocHandler('doc-123', mockUser)).rejects.toThrow(
      'User is not associated with an organization'
    );
  });

  it('should work for any user role', async () => {
    const roles = ['member', 'workspace_admin', 'data_admin'];

    for (const role of roles) {
      vi.clearAllMocks();

      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role,
      });
      (getDoc as Mock).mockResolvedValue(mockDoc);

      const result = await getDocHandler('doc-123', mockUser);

      expect(result).toEqual(mockDoc);
    }
  });

  it('should handle database errors gracefully', async () => {
    (getDoc as Mock).mockRejectedValue(new Error('Database error'));

    await expect(getDocHandler('doc-123', mockUser)).rejects.toThrow('Database error');
  });
});
