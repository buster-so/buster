import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPermission, computeEffectivePermission } from './checks';
import type { AssetPermissionResult } from './checks';

// Mock database queries
vi.mock('@buster/database/queries', () => ({
  checkAssetPermission: vi.fn(),
  getUserOrganizationsByUserId: vi.fn(),
}));

// Mock cascading permissions
vi.mock('./cascading-permissions', () => ({
  checkCascadingPermissions: vi.fn(),
}));

// Mock cache
vi.mock('./cache', () => ({
  getCachedPermission: vi.fn(),
  setCachedPermission: vi.fn(),
}));

describe('Asset Permission Checks', () => {
  let mockCheckAssetPermission: any;
  let mockGetUserOrganizationsByUserId: any;
  let mockCheckCascadingPermissions: any;
  let mockGetCachedPermission: any;
  let mockSetCachedPermission: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database/queries');
    mockCheckAssetPermission = vi.mocked(db.checkAssetPermission);
    mockGetUserOrganizationsByUserId = vi.mocked(db.getUserOrganizationsByUserId);

    const cascading = await import('./cascading-permissions');
    mockCheckCascadingPermissions = vi.mocked(cascading.checkCascadingPermissions);

    const cache = await import('./cache');
    mockGetCachedPermission = vi.mocked(cache.getCachedPermission);
    mockSetCachedPermission = vi.mocked(cache.setCachedPermission);
  });

  describe('checkPermission', () => {
    const defaultCheck = {
      userId: 'user123',
      assetId: 'asset123',
      assetType: 'dashboard_file' as const,
      requiredRole: 'can_view' as const,
    };

    beforeEach(() => {
      // Default: no cache, no org memberships
      mockGetCachedPermission.mockReturnValue(undefined);
      mockGetUserOrganizationsByUserId.mockResolvedValue([]);
    });

    it('should return cached result if available', async () => {
      const cachedResult: AssetPermissionResult = {
        hasAccess: true,
        effectiveRole: 'can_edit',
        accessPath: 'direct',
      };
      mockGetCachedPermission.mockReturnValue(cachedResult);

      const result = await checkPermission(defaultCheck);

      expect(result).toEqual(cachedResult);
      expect(mockCheckAssetPermission).not.toHaveBeenCalled();
    });

    it('should grant access with direct permission', async () => {
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'direct',
      });

      const result = await checkPermission(defaultCheck);

      expect(result).toEqual({
        hasAccess: true,
        effectiveRole: 'owner',
        accessPath: 'direct',
      });
      expect(mockSetCachedPermission).toHaveBeenCalled();
    });

    it('should deny access if role is insufficient', async () => {
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: true,
        role: 'can_view',
        accessPath: 'direct',
      });

      const result = await checkPermission({
        ...defaultCheck,
        requiredRole: 'can_edit', // Requires higher permission
      });

      expect(result.hasAccess).toBe(false);
    });

    it('should grant admin access', async () => {
      mockGetUserOrganizationsByUserId.mockResolvedValue([
        { organizationId: 'org123', role: 'workspace_admin' },
      ]);
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: true,
        role: 'owner',
        accessPath: 'admin',
      });

      const result = await checkPermission({
        ...defaultCheck,
        organizationId: 'org123',
      });

      expect(result).toEqual({
        hasAccess: true,
        effectiveRole: 'owner',
        accessPath: 'admin',
      });
    });

    it('should check workspace sharing', async () => {
      mockGetUserOrganizationsByUserId.mockResolvedValue([
        { organizationId: 'org123', role: 'viewer' },
      ]);
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: false,
      });

      const result = await checkPermission({
        ...defaultCheck,
        organizationId: 'org123',
        workspaceSharing: 'can_edit',
      });

      expect(result).toEqual({
        hasAccess: true,
        effectiveRole: 'can_edit',
        accessPath: 'workspace_sharing',
      });
    });

    it('should deny workspace sharing if not org member', async () => {
      mockGetUserOrganizationsByUserId.mockResolvedValue([]);
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: false,
      });

      const result = await checkPermission({
        ...defaultCheck,
        organizationId: 'org123',
        workspaceSharing: 'can_view',
      });

      expect(result.hasAccess).toBe(false);
    });

    it('should check cascading permissions for can_view', async () => {
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: false,
      });
      mockCheckCascadingPermissions.mockResolvedValue(true);

      const result = await checkPermission({
        ...defaultCheck,
        requiredRole: 'can_view',
      });

      expect(result).toEqual({
        hasAccess: true,
        effectiveRole: 'can_view',
        accessPath: 'cascading',
      });
      expect(mockCheckCascadingPermissions).toHaveBeenCalled();
    });

    it('should not check cascading for higher permissions', async () => {
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: false,
      });

      const result = await checkPermission({
        ...defaultCheck,
        requiredRole: 'can_edit',
      });

      expect(result.hasAccess).toBe(false);
      expect(mockCheckCascadingPermissions).not.toHaveBeenCalled();
    });

    it('should cache negative results', async () => {
      mockCheckAssetPermission.mockResolvedValue({
        hasAccess: false,
      });
      mockCheckCascadingPermissions.mockResolvedValue(false);

      const result = await checkPermission(defaultCheck);

      expect(result.hasAccess).toBe(false);
      expect(mockSetCachedPermission).toHaveBeenCalledWith(
        'user123',
        'asset123',
        'dashboard_file',
        'can_view',
        { hasAccess: false }
      );
    });
  });

  describe('computeEffectivePermission', () => {
    const mockOrgs = [{ id: 'org123', role: 'viewer' as const }];

    it('should return owner for workspace_admin', () => {
      const result = computeEffectivePermission(null, 'none', 'org123', [
        { id: 'org123', role: 'workspace_admin' },
      ]);

      expect(result).toBe('owner');
    });

    it('should return owner for data_admin', () => {
      const result = computeEffectivePermission(null, 'none', 'org123', [
        { id: 'org123', role: 'data_admin' },
      ]);

      expect(result).toBe('owner');
    });

    it('should return direct role if no admin', () => {
      const result = computeEffectivePermission('can_edit', 'none', 'org123', mockOrgs);

      expect(result).toBe('can_edit');
    });

    it('should combine direct and workspace sharing', () => {
      const result = computeEffectivePermission('can_view', 'can_edit', 'org123', mockOrgs);

      expect(result).toBe('can_edit'); // Higher of the two
    });

    it('should return null if no permissions', () => {
      const result = computeEffectivePermission(null, 'none', 'org123', []);

      expect(result).toBe(null);
    });

    it('should ignore workspace sharing if not org member', () => {
      const result = computeEffectivePermission(
        null,
        'full_access',
        'org123',
        [] // Not a member
      );

      expect(result).toBe(null);
    });
  });
});
