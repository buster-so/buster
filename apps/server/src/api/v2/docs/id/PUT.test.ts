import type { User } from '@buster/database/queries';
import { getUserOrganizationId, updateDoc } from '@buster/database/queries';
import type { UpdateDocRequest } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { updateDocHandler } from './PUT';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');

describe('updateDocHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  const mockDoc = {
    id: 'doc-123',
    name: 'Updated Doc',
    content: 'Updated content',
    type: 'analyst' as const,
    organizationId: 'org-123',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    beforeEach(() => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (updateDoc as Mock).mockResolvedValue(mockDoc);
    });

    it('should update doc with workspace_admin role', async () => {
      const request: UpdateDocRequest = {
        name: 'Updated Doc',
        content: 'Updated content',
        type: 'analyst',
      };

      const result = await updateDocHandler('doc-123', request, mockUser);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
      expect(updateDoc).toHaveBeenCalledWith({
        id: 'doc-123',
        organizationId: 'org-123',
        name: 'Updated Doc',
        content: 'Updated content',
        type: 'analyst',
      });
      expect(result).toEqual(mockDoc);
    });

    it('should update doc with data_admin role', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'data_admin',
      });

      const request: UpdateDocRequest = {
        name: 'Updated Doc',
      };

      const result = await updateDocHandler('doc-123', request, mockUser);

      expect(result).toEqual(mockDoc);
    });

    it('should update only specified fields', async () => {
      const request: UpdateDocRequest = {
        content: 'Only update content',
      };

      await updateDocHandler('doc-123', request, mockUser);

      expect(updateDoc).toHaveBeenCalledWith({
        id: 'doc-123',
        organizationId: 'org-123',
        name: undefined,
        content: 'Only update content',
        type: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('should throw 403 if user is not associated with an organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      const request: UpdateDocRequest = {
        name: 'Updated Doc',
      };

      await expect(updateDocHandler('doc-123', request, mockUser)).rejects.toThrow(
        'User is not associated with an organization'
      );
    });

    it('should throw 403 if user is not an admin', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'member', // Not an admin
      });

      const request: UpdateDocRequest = {
        name: 'Updated Doc',
      };

      await expect(updateDocHandler('doc-123', request, mockUser)).rejects.toThrow(
        'User is not an admin'
      );
    });

    it('should throw 404 if doc not found', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (updateDoc as Mock).mockResolvedValue(null);

      const request: UpdateDocRequest = {
        name: 'Updated Doc',
      };

      await expect(updateDocHandler('doc-123', request, mockUser)).rejects.toThrow(
        'Document not found'
      );
    });

    it('should handle database errors', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (updateDoc as Mock).mockRejectedValue(new Error('Database error'));

      const request: UpdateDocRequest = {
        name: 'Updated Doc',
      };

      await expect(updateDocHandler('doc-123', request, mockUser)).rejects.toThrow(
        'Database error'
      );
    });
  });

  it('should handle empty update request', async () => {
    (getUserOrganizationId as Mock).mockResolvedValue({
      organizationId: 'org-123',
      role: 'workspace_admin',
    });
    (updateDoc as Mock).mockResolvedValue(mockDoc);

    const request: UpdateDocRequest = {}; // Empty update

    await updateDocHandler('doc-123', request, mockUser);

    expect(updateDoc).toHaveBeenCalledWith({
      id: 'doc-123',
      organizationId: 'org-123',
      name: undefined,
      content: undefined,
      type: undefined,
    });
  });
});
