import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlError } from '../types/errors';
import {
  createPermission,
  createPermissionByEmail,
  hasAssetPermission,
  listPermissions,
  removePermission,
  removePermissionByEmail,
} from './permissions';

// Mock database functions
vi.mock('@buster/database', () => ({
  createAssetPermission: vi.fn(),
  bulkCreateAssetPermissions: vi.fn(),
  listAssetPermissions: vi.fn(),
  getUserAssetPermission: vi.fn(),
  removeAssetPermission: vi.fn(),
  bulkRemoveAssetPermissions: vi.fn(),
  findUserByEmail: vi.fn(),
  // TODO: Add createUser when implemented
  // createUser: vi.fn(),
}));

// Mock cache functions
vi.mock('./cache', () => ({
  invalidateOnPermissionChange: vi.fn(),
}));

// Mock checks module
vi.mock('./checks', () => ({
  checkPermission: vi.fn(),
}));

describe('Asset Permissions', () => {
  let mockCreateAssetPermission: any;
  let mockListAssetPermissions: any;
  let mockRemoveAssetPermission: any;
  let mockFindUserByEmail: any;
  let mockCreateUser: any;
  let mockInvalidateOnPermissionChange: any;
  let mockCheckPermission: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database');
    mockCreateAssetPermission = vi.mocked(db.createAssetPermission);
    mockListAssetPermissions = vi.mocked(db.listAssetPermissions);
    mockRemoveAssetPermission = vi.mocked(db.removeAssetPermission);
    mockFindUserByEmail = vi.mocked(db.findUserByEmail);
    // TODO: Mock createUser when implemented
    // mockCreateUser = vi.mocked(db.createUser);

    const cache = await import('./cache');
    mockInvalidateOnPermissionChange = vi.mocked(cache.invalidateOnPermissionChange);

    const checks = await import('./checks');
    mockCheckPermission = vi.mocked(checks.checkPermission);
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      const mockPermission = {
        identityId: 'user123',
        identityType: 'user',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        role: 'can_edit',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateAssetPermission.mockResolvedValue(mockPermission);

      const result = await createPermission({
        assetId: 'asset123',
        assetType: 'dashboard_file',
        identityId: 'user123',
        identityType: 'user',
        role: 'can_edit',
        createdBy: 'admin123',
      });

      expect(result).toEqual(mockPermission);
      expect(mockCreateAssetPermission).toHaveBeenCalledWith({
        identityId: 'user123',
        identityType: 'user',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        role: 'can_edit',
        createdBy: 'admin123',
      });

      // Should invalidate cache
      expect(mockInvalidateOnPermissionChange).toHaveBeenCalledWith(
        'user123',
        'user',
        'asset123',
        'dashboard_file'
      );
    });

    it('should reject deprecated asset types', async () => {
      await expect(
        createPermission({
          assetId: 'asset123',
          assetType: 'dashboard', // deprecated
          identityId: 'user123',
          identityType: 'user',
          role: 'can_edit',
          createdBy: 'admin123',
        })
      ).rejects.toThrow(AccessControlError);

      expect(mockCreateAssetPermission).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockCreateAssetPermission.mockRejectedValue(new Error('DB Error'));

      await expect(
        createPermission({
          assetId: 'asset123',
          assetType: 'dashboard_file',
          identityId: 'user123',
          identityType: 'user',
          role: 'can_edit',
          createdBy: 'admin123',
        })
      ).rejects.toThrow(AccessControlError);
    });
  });

  describe('createPermissionByEmail', () => {
    it('should create permission for existing user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockCreateAssetPermission.mockResolvedValue({
        identityId: 'user123',
        identityType: 'user',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        role: 'can_view',
      });

      const result = await createPermissionByEmail({
        assetId: 'asset123',
        assetType: 'dashboard_file',
        email: 'test@example.com',
        role: 'can_view',
        createdBy: 'admin123',
      });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeDefined();
      expect(mockInvalidateOnPermissionChange).toHaveBeenCalled();
    });

    it('should throw not implemented error when creating user', async () => {
      mockFindUserByEmail.mockResolvedValueOnce(null); // Not found

      await expect(
        createPermissionByEmail({
          assetId: 'asset123',
          assetType: 'dashboard_file',
          email: 'new@example.com',
          role: 'can_view',
          createdBy: 'admin123',
          createUserIfNotExists: true,
        })
      ).rejects.toThrow('User creation not yet implemented');
    });

    it('should reject invalid email format', async () => {
      await expect(
        createPermissionByEmail({
          assetId: 'asset123',
          assetType: 'dashboard_file',
          email: 'notanemail',
          role: 'can_view',
          createdBy: 'admin123',
        })
      ).rejects.toThrow('Invalid email address');
    });

    it('should handle user not found when not creating', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(
        createPermissionByEmail({
          assetId: 'asset123',
          assetType: 'dashboard_file',
          email: 'notfound@example.com',
          role: 'can_view',
          createdBy: 'admin123',
          createUserIfNotExists: false,
        })
      ).rejects.toThrow('User creation not yet implemented');
    });
  });

  describe('listPermissions', () => {
    it('should list permissions with user info', async () => {
      const mockPermissions = [
        {
          identityId: 'user1',
          identityType: 'user',
          assetId: 'asset123',
          assetType: 'dashboard_file',
          role: 'owner',
          userInfo: {
            id: 'user1',
            email: 'user1@example.com',
            name: 'User One',
          },
        },
        {
          identityId: 'team1',
          identityType: 'team',
          assetId: 'asset123',
          assetType: 'dashboard_file',
          role: 'can_edit',
        },
      ];

      mockListAssetPermissions.mockResolvedValue(mockPermissions);

      const result = await listPermissions({
        assetId: 'asset123',
        assetType: 'dashboard_file',
      });

      expect(result).toEqual(mockPermissions);
      expect(mockListAssetPermissions).toHaveBeenCalledWith({
        assetId: 'asset123',
        assetType: 'dashboard_file',
      });
    });

    it('should handle empty results', async () => {
      mockListAssetPermissions.mockResolvedValue([]);

      const result = await listPermissions({
        assetId: 'asset123',
        assetType: 'dashboard_file',
      });

      expect(result).toEqual([]);
    });
  });

  describe('removePermission', () => {
    it('should remove permission successfully', async () => {
      mockRemoveAssetPermission.mockResolvedValue({ deletedAt: new Date() });

      const result = await removePermission({
        identityId: 'user123',
        identityType: 'user',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        updatedBy: 'admin123',
      });

      expect(result).toBe(true);
      expect(mockInvalidateOnPermissionChange).toHaveBeenCalledWith(
        'user123',
        'user',
        'asset123',
        'dashboard_file'
      );
    });

    it('should return false when permission not found', async () => {
      mockRemoveAssetPermission.mockResolvedValue(null);

      const result = await removePermission({
        identityId: 'user123',
        identityType: 'user',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        updatedBy: 'admin123',
      });

      expect(result).toBe(false);
      expect(mockInvalidateOnPermissionChange).not.toHaveBeenCalled();
    });
  });

  describe('removePermissionByEmail', () => {
    it('should remove permission by email', async () => {
      mockFindUserByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
      });
      mockRemoveAssetPermission.mockResolvedValue({ deletedAt: new Date() });

      const result = await removePermissionByEmail({
        assetId: 'asset123',
        assetType: 'dashboard_file',
        email: 'test@example.com',
        updatedBy: 'admin123',
      });

      expect(result).toBe(true);
      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle user not found', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(
        removePermissionByEmail({
          assetId: 'asset123',
          assetType: 'dashboard_file',
          email: 'notfound@example.com',
          updatedBy: 'admin123',
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('hasAssetPermission', () => {
    it('should check permission using checkPermission', async () => {
      mockCheckPermission.mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_edit',
        accessPath: 'direct',
      });

      const result = await hasAssetPermission({
        userId: 'user123',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        requiredRole: 'can_view',
      });

      expect(result).toBe(true);
      expect(mockCheckPermission).toHaveBeenCalledWith({
        userId: 'user123',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        requiredRole: 'can_view',
      });
    });

    it('should return false when no access', async () => {
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
      });

      const result = await hasAssetPermission({
        userId: 'user123',
        assetId: 'asset123',
        assetType: 'dashboard_file',
        requiredRole: 'can_edit',
      });

      expect(result).toBe(false);
    });
  });
});
