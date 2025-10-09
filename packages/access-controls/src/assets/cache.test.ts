import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllCaches,
  getCachedCascadingPermission,
  getCachedPermission,
  getCacheStats,
  invalidateAsset,
  invalidateOnPermissionChange,
  invalidateUser,
  invalidateUserAsset,
  resetCacheStats,
  setCachedCascadingPermission,
  setCachedPermission,
} from './cache';
import type { AssetPermissionResult } from './checks';

describe('Asset Permission Cache', () => {
  beforeEach(() => {
    clearAllCaches();
    resetCacheStats();
  });

  describe('Permission Cache', () => {
    it('should cache and retrieve permission results', () => {
      const result: AssetPermissionResult = {
        hasAccess: true,
        effectiveRole: 'can_edit',
        accessPath: 'direct',
      };

      // Should return undefined for uncached
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();

      // Set cache
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', result);

      // Should retrieve cached result
      const cached = getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view');
      expect(cached).toEqual(result);
    });

    it('should handle different cache keys independently', () => {
      const result1: AssetPermissionResult = {
        hasAccess: true,
        effectiveRole: 'owner',
        accessPath: 'direct',
      };
      const result2: AssetPermissionResult = { hasAccess: false };

      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit', result1);
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', result2);
      setCachedPermission('user2', 'asset1', 'dashboard_file', 'can_edit', result2);
      setCachedPermission('user1', 'asset2', 'dashboard_file', 'can_edit', result2);

      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit')).toEqual(result1);
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toEqual(result2);
      expect(getCachedPermission('user2', 'asset1', 'dashboard_file', 'can_edit')).toEqual(result2);
      expect(getCachedPermission('user1', 'asset2', 'dashboard_file', 'can_edit')).toEqual(result2);
    });

    it('should track cache hits and misses', () => {
      const result: AssetPermissionResult = { hasAccess: true };

      // Initial stats
      let stats = getCacheStats();
      expect(stats.permission.hits).toBe(0);
      expect(stats.permission.misses).toBe(0);

      // Miss
      getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view');
      stats = getCacheStats();
      expect(stats.permission.hits).toBe(0);
      expect(stats.permission.misses).toBe(1);

      // Set cache
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', result);

      // Hit
      getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view');
      stats = getCacheStats();
      expect(stats.permission.hits).toBe(1);
      expect(stats.permission.misses).toBe(1);
      expect(stats.permission.hitRate).toBe('50.00%');
    });
  });

  describe('Cascading Permission Cache', () => {
    it('should cache and retrieve cascading permission results', () => {
      // Should return undefined for uncached
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeUndefined();

      // Set cache
      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);

      // Should retrieve cached result
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBe(true);

      // Set false result
      setCachedCascadingPermission('user1', 'metric2', 'metric_file', false);
      expect(getCachedCascadingPermission('user1', 'metric2', 'metric_file')).toBe(false);
    });

    it('should track cascading cache stats separately', () => {
      // Initial stats
      let stats = getCacheStats();
      expect(stats.cascading.hits).toBe(0);
      expect(stats.cascading.misses).toBe(0);

      // Miss
      getCachedCascadingPermission('user1', 'metric1', 'metric_file');
      stats = getCacheStats();
      expect(stats.cascading.misses).toBe(1);

      // Set and hit
      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);
      getCachedCascadingPermission('user1', 'metric1', 'metric_file');
      stats = getCacheStats();
      expect(stats.cascading.hits).toBe(1);
      expect(stats.cascading.hitRate).toBe('50.00%');
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Set up some cached data
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', { hasAccess: true });
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit', { hasAccess: true });
      setCachedPermission('user2', 'asset1', 'dashboard_file', 'can_view', { hasAccess: true });
      setCachedPermission('user1', 'asset2', 'dashboard_file', 'can_view', { hasAccess: true });

      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);
      setCachedCascadingPermission('user1', 'dashboard1', 'dashboard_file', true);
    });

    it('should invalidate all cache entries for a specific asset', () => {
      // Verify cache exists
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeDefined();
      expect(getCachedPermission('user2', 'asset1', 'dashboard_file', 'can_view')).toBeDefined();

      // Invalidate asset
      invalidateAsset('asset1', 'dashboard_file');

      // Should be invalidated
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit')).toBeUndefined();
      expect(getCachedPermission('user2', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();

      // Other assets should remain
      expect(getCachedPermission('user1', 'asset2', 'dashboard_file', 'can_view')).toBeDefined();
    });

    it('should invalidate all cache entries for a specific user', () => {
      // Verify cache exists
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeDefined();
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeDefined();

      // Invalidate user
      invalidateUser('user1');

      // Should be invalidated
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit')).toBeUndefined();
      expect(getCachedPermission('user1', 'asset2', 'dashboard_file', 'can_view')).toBeUndefined();
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeUndefined();

      // Other users should remain
      expect(getCachedPermission('user2', 'asset1', 'dashboard_file', 'can_view')).toBeDefined();
    });

    it('should invalidate specific user-asset combination', () => {
      // Invalidate specific combination
      invalidateUserAsset('user1', 'asset1', 'dashboard_file');

      // Should invalidate all permission levels for this combination
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();
      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_edit')).toBeUndefined();

      // Other combinations should remain
      expect(getCachedPermission('user2', 'asset1', 'dashboard_file', 'can_view')).toBeDefined();
      expect(getCachedPermission('user1', 'asset2', 'dashboard_file', 'can_view')).toBeDefined();
    });

    it('should invalidate cascading permissions when parent permissions change', () => {
      // Set up cascading cache
      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);
      setCachedCascadingPermission('user2', 'metric1', 'metric_file', true);
      setCachedCascadingPermission('user1', 'dashboard1', 'dashboard_file', true);

      // Change collection permission (affects all cascading)
      invalidateOnPermissionChange('coll1', 'user', 'asset1', 'collection');

      // All cascading cache should be invalidated
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeUndefined();
      expect(getCachedCascadingPermission('user2', 'metric1', 'metric_file')).toBeUndefined();
      expect(getCachedCascadingPermission('user1', 'dashboard1', 'dashboard_file')).toBeUndefined();
    });

    it('should invalidate metric cascading when dashboard permission changes', () => {
      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);
      setCachedCascadingPermission('user1', 'metric2', 'metric_file', true);
      setCachedCascadingPermission('user1', 'dashboard1', 'dashboard_file', true);

      // Change dashboard permission
      invalidateOnPermissionChange('user1', 'user', 'dash1', 'dashboard_file');

      // Metric cascading should be invalidated
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeUndefined();
      expect(getCachedCascadingPermission('user1', 'metric2', 'metric_file')).toBeUndefined();
      // Dashboard cascading should remain (not affected by dashboard changes)
      expect(getCachedCascadingPermission('user1', 'dashboard1', 'dashboard_file')).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', { hasAccess: true });
      setCachedCascadingPermission('user1', 'metric1', 'metric_file', true);

      clearAllCaches();

      expect(getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view')).toBeUndefined();
      expect(getCachedCascadingPermission('user1', 'metric1', 'metric_file')).toBeUndefined();
    });

    it('should reset cache stats', () => {
      // Generate some stats
      getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view');
      setCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view', { hasAccess: true });
      getCachedPermission('user1', 'asset1', 'dashboard_file', 'can_view');

      let stats = getCacheStats();
      expect(stats.permission.hits).toBe(1);
      expect(stats.permission.misses).toBe(1);

      // Reset stats
      resetCacheStats();
      stats = getCacheStats();
      expect(stats.permission.hits).toBe(0);
      expect(stats.permission.misses).toBe(0);
      expect(stats.permission.size).toBe(1); // Cache still has data
    });

    it('should respect cache size limits', () => {
      const stats = getCacheStats();
      expect(stats.permission.maxSize).toBe(10000);
      expect(stats.cascading.maxSize).toBe(5000);
    });
  });
});
