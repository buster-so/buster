import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAdminPermissions,
  checkWorkspaceAdminPermission,
  ensureDefaultPermissionGroup,
  fetchDefaultDatasets,
  fetchOrganization,
  updateDefaultDatasets,
  validateUserOrganization,
} from './security-utils';
import { createTestOrganization } from './test-fixtures';

// Mock dependencies
vi.mock('@buster/database/connection', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
  getUserOrganizationId: vi.fn(),
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock('@buster/database/queries', () => ({
  getUserOrganizationId: vi.fn(),
}));

vi.mock('@buster/database/schema', () => ({
  organizations: {},
  datasets: {},
  datasetsToPermissionGroups: {},
  permissionGroups: {},
}));

import { and, db, eq, isNull } from '@buster/database/connection';
import { getUserOrganizationId } from '@buster/database/queries';

describe('security-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserOrganization', () => {
    it('should return user organization when found', async () => {
      const mockOrgMembership = { organizationId: 'org-123', role: 'viewer' as const };
      vi.mocked(getUserOrganizationId).mockResolvedValueOnce(mockOrgMembership);

      const result = await validateUserOrganization('user-123');
      expect(result).toEqual(mockOrgMembership);
      expect(getUserOrganizationId).toHaveBeenCalledWith('user-123');
    });

    it('should throw 403 when user has no organization', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValueOnce(null);

      await expect(validateUserOrganization('user-123')).rejects.toThrow(HTTPException);
      await expect(validateUserOrganization('user-123')).rejects.toMatchObject({
        status: 403,
        message: 'User is not associated with an organization',
      });
    });
  });

  describe('fetchOrganization', () => {
    it('should return organization when found', async () => {
      const mockOrg = createTestOrganization({ id: 'org-123' });
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockOrg]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await fetchOrganization('org-123');
      expect(result).toEqual(mockOrg);
    });

    it('should throw 404 when organization not found', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      await expect(fetchOrganization('org-123')).rejects.toThrow(HTTPException);
      await expect(fetchOrganization('org-123')).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });
    });

    it('should throw 404 when query returns null', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([null]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      await expect(fetchOrganization('org-123')).rejects.toThrow(HTTPException);
      await expect(fetchOrganization('org-123')).rejects.toMatchObject({
        status: 404,
        message: 'Organization not found',
      });
    });
  });

  describe('checkAdminPermissions', () => {
    it('should allow workspace_admin role', () => {
      expect(() => checkAdminPermissions('workspace_admin')).not.toThrow();
    });

    it('should allow data_admin role', () => {
      expect(() => checkAdminPermissions('data_admin')).not.toThrow();
    });

    it('should reject other roles', () => {
      const roles = ['member', 'viewer', 'user', 'guest'];

      for (const role of roles) {
        expect(() => checkAdminPermissions(role)).toThrow(HTTPException);
        expect(() => checkAdminPermissions(role)).toThrow('Insufficient admin permissions');
      }
    });

    it('should reject null role', () => {
      expect(() => checkAdminPermissions(null)).toThrow(HTTPException);
      expect(() => checkAdminPermissions(null)).toThrow('Insufficient admin permissions');
    });

    it('should reject undefined role', () => {
      expect(() => checkAdminPermissions(undefined as any)).toThrow(HTTPException);
    });
  });

  describe('checkWorkspaceAdminPermission', () => {
    it('should allow workspace_admin role', () => {
      expect(() => checkWorkspaceAdminPermission('workspace_admin')).not.toThrow();
    });

    it('should reject data_admin role', () => {
      expect(() => checkWorkspaceAdminPermission('data_admin')).toThrow(HTTPException);
      expect(() => checkWorkspaceAdminPermission('data_admin')).toThrow(
        'Only workspace admins can update workspace settings'
      );
    });

    it('should reject other roles', () => {
      const roles = ['admin', 'member', 'viewer', 'user'];

      for (const role of roles) {
        expect(() => checkWorkspaceAdminPermission(role)).toThrow(HTTPException);
        expect(() => checkWorkspaceAdminPermission(role)).toThrow(
          'Only workspace admins can update workspace settings'
        );
      }
    });

    it('should reject null role', () => {
      expect(() => checkWorkspaceAdminPermission(null)).toThrow(HTTPException);
      expect(() => checkWorkspaceAdminPermission(null)).toThrow(
        'Only workspace admins can update workspace settings'
      );
    });
  });

  describe('fetchDefaultDatasets', () => {
    it('should return datasets from default permission group', async () => {
      const mockDatasets = [
        { id: 'dataset-1', name: 'Sales Data' },
        { id: 'dataset-2', name: 'Customer Data' },
      ];

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockDatasets),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await fetchDefaultDatasets('org-123');

      expect(result).toEqual(mockDatasets);
      expect(mockDbChain.innerJoin).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no default datasets', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await fetchDefaultDatasets('org-123');

      expect(result).toEqual([]);
    });
  });

  describe('ensureDefaultPermissionGroup', () => {
    it('should return existing permission group ID', async () => {
      const mockExistingGroup = [{ id: 'pg-123', name: 'default:org-123' }];

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockExistingGroup),
      };

      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await ensureDefaultPermissionGroup('org-123', 'user-123');

      expect(result).toBe('pg-123');
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should create new permission group when not exists', async () => {
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const mockDbInsertChain = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'pg-new' }]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbSelectChain as any);
      vi.mocked(db.insert).mockReturnValue(mockDbInsertChain as any);

      const result = await ensureDefaultPermissionGroup('org-123', 'user-123');

      expect(result).toBe('pg-new');
      expect(mockDbInsertChain.values).toHaveBeenCalledWith({
        name: 'default:org-123',
        organizationId: 'org-123',
        createdBy: 'user-123',
        updatedBy: 'user-123',
      });
    });

    it('should restore soft deleted permission group', async () => {
      const mockExistingGroup = [
        {
          id: 'pg-123',
          name: 'default:org-123',
          deletedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockExistingGroup),
      };

      const mockDbUpdateChain = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.select).mockReturnValue(mockDbSelectChain as any);
      vi.mocked(db.update).mockReturnValue(mockDbUpdateChain as any);

      const result = await ensureDefaultPermissionGroup('org-123', 'user-123');

      expect(result).toBe('pg-123');
      expect(db.update).toHaveBeenCalled();
      expect(mockDbUpdateChain.set).toHaveBeenCalledWith({
        deletedAt: null,
        updatedBy: 'user-123',
        updatedAt: expect.any(String),
      });
    });

    it('should throw error when insert fails', async () => {
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const mockDbInsertChain = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockDbSelectChain as any);
      vi.mocked(db.insert).mockReturnValue(mockDbInsertChain as any);

      await expect(ensureDefaultPermissionGroup('org-123', 'user-123')).rejects.toThrow(
        HTTPException
      );
      await expect(ensureDefaultPermissionGroup('org-123', 'user-123')).rejects.toMatchObject({
        status: 500,
        message: 'Failed to create default permission group',
      });
    });
  });

  describe('updateDefaultDatasets', () => {
    it('should update datasets with specific IDs', async () => {
      // Mock ensureDefaultPermissionGroup
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'pg-123' }]),
      };

      // Mock valid datasets query
      const mockValidDatasets = [{ id: 'dataset-1' }, { id: 'dataset-2' }];

      vi.mocked(db.select)
        .mockReturnValueOnce(mockDbSelectChain as any) // For permission group
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockValidDatasets),
        } as any); // For dataset validation

      // Mock transaction
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // No existing records
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as any);
      });

      await updateDefaultDatasets('org-123', ['dataset-1', 'dataset-2'], 'user-123');

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('should update datasets with "all" keyword', async () => {
      // Mock ensureDefaultPermissionGroup
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'pg-123' }]),
      };

      // Mock fetching all datasets
      const mockAllDatasets = [{ id: 'dataset-1' }, { id: 'dataset-2' }, { id: 'dataset-3' }];

      vi.mocked(db.select)
        .mockReturnValueOnce(mockDbSelectChain as any) // For permission group
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockAllDatasets),
        } as any); // For all datasets

      // Mock transaction
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // No existing records
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as any);
      });

      await updateDefaultDatasets('org-123', 'all', 'user-123');

      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('should handle empty dataset array', async () => {
      // Mock ensureDefaultPermissionGroup
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'pg-123' }]),
      };

      // Mock empty dataset validation query
      vi.mocked(db.select)
        .mockReturnValueOnce(mockDbSelectChain as any) // For permission group
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        } as any); // For dataset validation (empty)

      // Mock transaction
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // No existing records
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as any);
      });

      await updateDefaultDatasets('org-123', [], 'user-123');

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it('should filter out invalid dataset IDs', async () => {
      // Mock ensureDefaultPermissionGroup
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'pg-123' }]),
      };

      // Mock valid datasets query
      const mockValidDatasets = [{ id: 'dataset-1' }, { id: 'dataset-2' }];

      vi.mocked(db.select)
        .mockReturnValueOnce(mockDbSelectChain as any) // For permission group
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockValidDatasets),
        } as any); // For dataset validation

      // Mock transaction
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]), // No existing records
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnThis(),
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as any);
      });

      // Try to update with some invalid dataset IDs
      await updateDefaultDatasets('org-123', ['dataset-1', 'dataset-2', 'invalid-id'], 'user-123');

      // Should only insert valid datasets
      expect(mockTx.insert).toHaveBeenCalled();
      // With the new batch upsert logic, insert is called once with all valid datasets
      expect(mockTx.insert).toHaveBeenCalledTimes(1);
    });

    it('should restore soft-deleted dataset associations', async () => {
      // Mock ensureDefaultPermissionGroup
      const mockDbSelectChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'pg-123' }]),
      };

      // Mock valid datasets query
      const mockValidDatasets = [{ id: 'dataset-1' }, { id: 'dataset-2' }];

      vi.mocked(db.select)
        .mockReturnValueOnce(mockDbSelectChain as any) // For permission group
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockValidDatasets),
        } as any); // For dataset validation

      // Mock transaction
      const insertChain = {
        values: vi.fn().mockReturnThis(),
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      };

      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(undefined),
        }),
        insert: vi.fn().mockReturnValue(insertChain),
      };

      vi.mocked(db.transaction).mockImplementation(async (callback) => {
        return callback(mockTx as any);
      });

      await updateDefaultDatasets('org-123', ['dataset-1', 'dataset-2'], 'user-123');

      // Should soft-delete all existing first, then batch upsert
      expect(mockTx.update).toHaveBeenCalledTimes(1); // 1 for soft-delete all
      expect(mockTx.insert).toHaveBeenCalledTimes(1); // 1 batch upsert for both datasets

      // Verify the insert was called with values
      expect(mockTx.insert).toHaveBeenCalled();
      expect(insertChain.values).toHaveBeenCalled();
      expect(insertChain.onConflictDoUpdate).toHaveBeenCalled();
    });
  });
});
