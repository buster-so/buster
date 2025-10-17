import type { User } from '@buster/database/queries';
import { deleteDoc, getUserOrganizationId } from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { deleteDocHandler } from './DELETE';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');

describe('deleteDocHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  const mockDoc = {
    id: 'doc-123',
    name: 'Deleted Doc',
    content: 'Content',
    type: 'normal' as const,
    organizationId: 'org-123',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    deletedAt: '2024-01-16T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful deletion', () => {
    beforeEach(() => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (deleteDoc as Mock).mockResolvedValue(mockDoc);
    });

    it('should delete doc with workspace_admin role', async () => {
      const result = await deleteDocHandler('doc-123', mockUser);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
      expect(deleteDoc).toHaveBeenCalledWith({
        id: 'doc-123',
        organizationId: 'org-123',
      });
      expect(result).toEqual({
        success: true,
        message: 'Document deleted successfully',
      });
    });

    it('should delete doc with data_admin role', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'data_admin',
      });

      const result = await deleteDocHandler('doc-123', mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Document deleted successfully',
      });
    });
  });

  describe('error handling', () => {
    it('should throw 403 if user is not associated with an organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow(HTTPException);
      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow(
        'User is not associated with an organization'
      );
    });

    it('should throw 403 if user is not an admin', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'member', // Not an admin
      });

      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow(HTTPException);
      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow('User is not an admin');
    });

    it('should throw 404 if doc not found', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (deleteDoc as Mock).mockResolvedValue(null);

      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow(HTTPException);
      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow('Document not found');
    });

    it('should handle database errors', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (deleteDoc as Mock).mockRejectedValue(new Error('Database error'));

      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow('Database error');
    });
  });

  it('should verify admin roles correctly', async () => {
    const adminRoles = ['workspace_admin', 'data_admin'];
    const nonAdminRoles = ['member', 'viewer', 'guest'];

    for (const role of adminRoles) {
      vi.clearAllMocks();
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role,
      });
      (deleteDoc as Mock).mockResolvedValue(mockDoc);

      const result = await deleteDocHandler('doc-123', mockUser);
      expect(result.success).toBe(true);
    }

    for (const role of nonAdminRoles) {
      vi.clearAllMocks();
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role,
      });

      await expect(deleteDocHandler('doc-123', mockUser)).rejects.toThrow('User is not an admin');
    }
  });
});
