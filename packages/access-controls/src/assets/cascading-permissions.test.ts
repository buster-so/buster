import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlError } from '../types/errors';
import {
  checkCascadingPermissions,
  checkChatCollectionAccess,
  checkDashboardChatAccess,
  checkDashboardCollectionAccess,
  checkMetricChatAccess,
  checkMetricCollectionAccess,
  checkMetricDashboardAccess,
} from './cascading-permissions';

// Mock database queries
vi.mock('@buster/database', () => ({
  checkCollectionsContainingAsset: vi.fn(),
  checkDashboardsContainingMetric: vi.fn(),
  checkChatsContainingAsset: vi.fn(),
}));

// Mock hasAssetPermission
vi.mock('./permissions', () => ({
  hasAssetPermission: vi.fn(),
}));

// Mock cache
vi.mock('./cache', () => ({
  getCachedCascadingPermission: vi.fn(),
  setCachedCascadingPermission: vi.fn(),
}));

describe('Cascading Permissions', () => {
  let mockCheckDashboardsContainingMetric: any;
  let mockCheckChatsContainingAsset: any;
  let mockCheckCollectionsContainingAsset: any;
  let mockHasAssetPermission: any;
  let mockGetCachedCascadingPermission: any;
  let mockSetCachedCascadingPermission: any;

  const mockUser = { id: 'user123', email: 'test@example.com' };

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database');
    mockCheckDashboardsContainingMetric = vi.mocked(db.checkDashboardsContainingMetric);
    mockCheckChatsContainingAsset = vi.mocked(db.checkChatsContainingAsset);
    mockCheckCollectionsContainingAsset = vi.mocked(db.checkCollectionsContainingAsset);

    const permissions = await import('./permissions');
    mockHasAssetPermission = vi.mocked(permissions.hasAssetPermission);

    const cache = await import('./cache');
    mockGetCachedCascadingPermission = vi.mocked(cache.getCachedCascadingPermission);
    mockSetCachedCascadingPermission = vi.mocked(cache.setCachedCascadingPermission);
  });

  describe('checkMetricDashboardAccess', () => {
    it('should return true if user has access to any dashboard containing the metric', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([{ id: 'dash1' }, { id: 'dash2' }]);

      mockHasAssetPermission
        .mockResolvedValueOnce(false) // dash1 - no access
        .mockResolvedValueOnce(true); // dash2 - has access

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckDashboardsContainingMetric).toHaveBeenCalledWith('metric123');
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(2);
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'dash1',
        assetType: 'dashboard',
        userId: 'user123',
        requiredRole: 'can_view',
      });
    });

    it('should return false if no dashboards contain the metric', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).not.toHaveBeenCalled();
    });

    it('should return false if user has no access to any dashboard', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([{ id: 'dash1' }, { id: 'dash2' }]);

      mockHasAssetPermission.mockResolvedValue(false);

      const result = await checkMetricDashboardAccess('metric123', mockUser as any);

      expect(result).toBe(false);
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(2);
    });

    it('should handle errors', async () => {
      mockCheckDashboardsContainingMetric.mockRejectedValue(new Error('DB Error'));

      await expect(checkMetricDashboardAccess('metric123', mockUser as any)).rejects.toThrow(
        AccessControlError
      );
    });
  });

  describe('checkMetricChatAccess', () => {
    it('should check if user has access to chats containing the metric', async () => {
      mockCheckChatsContainingAsset.mockResolvedValue([{ id: 'chat1' }, { id: 'chat2' }]);

      mockHasAssetPermission.mockResolvedValueOnce(true); // chat1 - has access

      const result = await checkMetricChatAccess('metric123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckChatsContainingAsset).toHaveBeenCalledWith('metric123', 'metric');
      expect(mockHasAssetPermission).toHaveBeenCalledTimes(1); // Stops on first match
    });
  });

  describe('checkDashboardCollectionAccess', () => {
    it('should check if user has access to collections containing the dashboard', async () => {
      mockCheckCollectionsContainingAsset.mockResolvedValue([{ id: 'coll1' }]);

      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkDashboardCollectionAccess('dash123', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckCollectionsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard');
      expect(mockHasAssetPermission).toHaveBeenCalledWith({
        assetId: 'coll1',
        assetType: 'collection',
        userId: 'user123',
        requiredRole: 'can_view',
      });
    });
  });

  describe('checkCascadingPermissions', () => {
    beforeEach(() => {
      // Cache returns undefined by default (not cached)
      mockGetCachedCascadingPermission.mockReturnValue(undefined);
    });

    it('should use cached result if available', async () => {
      mockGetCachedCascadingPermission.mockReturnValue(true);

      const result = await checkCascadingPermissions('asset123', 'metric', mockUser as any);

      expect(result).toBe(true);
      expect(mockGetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'asset123',
        'metric'
      );
      // Should not call any check functions
      expect(mockCheckDashboardsContainingMetric).not.toHaveBeenCalled();
    });

    it('should check all paths for metrics', async () => {
      // No dashboards
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);
      // No chats
      mockCheckChatsContainingAsset.mockResolvedValueOnce([]);
      // Has collection access
      mockCheckCollectionsContainingAsset.mockResolvedValue([{ id: 'coll1' }]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('metric123', 'metric', mockUser as any);

      expect(result).toBe(true);
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'metric123',
        'metric',
        true
      );
    });

    it('should check dashboard cascading paths', async () => {
      // Has chat access
      mockCheckChatsContainingAsset.mockResolvedValue([{ id: 'chat1' }]);
      mockHasAssetPermission.mockResolvedValue(true);

      const result = await checkCascadingPermissions('dash123', 'dashboard', mockUser as any);

      expect(result).toBe(true);
      expect(mockCheckChatsContainingAsset).toHaveBeenCalledWith('dash123', 'dashboard');
    });

    it('should check chat cascading paths', async () => {
      // No collection access
      mockCheckCollectionsContainingAsset.mockResolvedValue([]);

      const result = await checkCascadingPermissions('chat123', 'chat', mockUser as any);

      expect(result).toBe(false);
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'chat123',
        'chat',
        false
      );
    });

    it('should return false for collections (no cascading)', async () => {
      const result = await checkCascadingPermissions('coll123', 'collection', mockUser as any);

      expect(result).toBe(false);
      // Should not call any check functions
      expect(mockCheckCollectionsContainingAsset).not.toHaveBeenCalled();
    });

    it('should return false for unknown asset types', async () => {
      const result = await checkCascadingPermissions(
        'unknown123',
        'unknown' as any,
        mockUser as any
      );

      expect(result).toBe(false);
    });

    it('should cache negative results', async () => {
      mockCheckDashboardsContainingMetric.mockResolvedValue([]);
      mockCheckChatsContainingAsset.mockResolvedValue([]);
      mockCheckCollectionsContainingAsset.mockResolvedValue([]);

      const result = await checkCascadingPermissions('metric123', 'metric', mockUser as any);

      expect(result).toBe(false);
      expect(mockSetCachedCascadingPermission).toHaveBeenCalledWith(
        'user123',
        'metric123',
        'metric',
        false
      );
    });

    it('should handle errors and not cache', async () => {
      mockCheckDashboardsContainingMetric.mockRejectedValue(new Error('DB Error'));

      await expect(
        checkCascadingPermissions('metric123', 'metric', mockUser as any)
      ).rejects.toThrow(AccessControlError);

      expect(mockSetCachedCascadingPermission).not.toHaveBeenCalled();
    });
  });
});
