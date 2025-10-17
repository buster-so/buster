import type { User } from '@buster/database/queries';
import { getUserOrganizationId, upsertDoc } from '@buster/database/queries';
import type { CreateDocRequest } from '@buster/server-shared/docs';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createDocHandler } from './POST';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');

describe('createDocHandler', () => {
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
  });

  describe('successful creation', () => {
    beforeEach(() => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (upsertDoc as Mock).mockResolvedValue(mockDoc);
    });

    it('should successfully create a doc with workspace_admin role', async () => {
      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      const result = await createDocHandler(request, mockUser);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
      expect(upsertDoc).toHaveBeenCalledWith({
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
        organizationId: 'org-123',
      });
      expect(result).toEqual(mockDoc);
    });

    it('should successfully create a doc with data_admin role', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'data_admin',
      });

      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'analyst',
      };

      const result = await createDocHandler(request, mockUser);

      expect(result).toEqual(mockDoc);
    });

    it('should create doc with default type if not provided', async () => {
      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      await createDocHandler(request, mockUser);

      expect(upsertDoc).toHaveBeenCalledWith({
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
        organizationId: 'org-123',
      });
    });
  });

  describe('error handling', () => {
    it('should throw 403 if user is not associated with an organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      await expect(createDocHandler(request, mockUser)).rejects.toThrow(HTTPException);
      await expect(createDocHandler(request, mockUser)).rejects.toThrow(
        'User is not associated with an organization'
      );
    });

    it('should throw 403 if user is not an admin', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'member', // Not an admin
      });

      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      await expect(createDocHandler(request, mockUser)).rejects.toThrow(HTTPException);
      await expect(createDocHandler(request, mockUser)).rejects.toThrow('User is not an admin');
    });

    it('should throw 500 if upsertDoc fails', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (upsertDoc as Mock).mockResolvedValue(null);

      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      await expect(createDocHandler(request, mockUser)).rejects.toThrow(HTTPException);
      await expect(createDocHandler(request, mockUser)).rejects.toThrow('Failed to create doc');
    });

    it('should throw 500 if database error occurs', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
      (upsertDoc as Mock).mockRejectedValue(new Error('Database error'));

      const request: CreateDocRequest = {
        name: 'Test Doc',
        content: 'Test content',
        type: 'normal',
      };

      await expect(createDocHandler(request, mockUser)).rejects.toThrow(HTTPException);
      await expect(createDocHandler(request, mockUser)).rejects.toThrow('Failed to create doc');
    });
  });
});
