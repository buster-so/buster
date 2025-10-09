import { beforeEach, describe, expect, it } from 'vitest';
import type { PermissionedDataset } from '../types/dataset-permissions';
import {
  clearAllCaches,
  getCachedDatasetAccess,
  getCachedPermissionedDatasets,
  getCacheStats,
  invalidateDataset,
  invalidateOnPermissionChange,
  invalidateUser,
  resetCacheStats,
  setCachedDatasetAccess,
  setCachedPermissionedDatasets,
} from './cache';

describe('Dataset Permission Cache', () => {
  beforeEach(() => {
    clearAllCaches();
    resetCacheStats();
  });

  describe('Dataset List Cache', () => {
    const mockDatasets: PermissionedDataset[] = [
      {
        id: 'ds1',
        name: 'Dataset 1',
        organizationId: 'org1',
        dataSourceId: 'source1',
        ymlContent: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ds2',
        name: 'Dataset 2',
        organizationId: 'org1',
        dataSourceId: 'source1',
        ymlContent: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should cache and retrieve dataset lists', () => {
      const result = { datasets: mockDatasets, total: 2 };

      // Should return undefined for uncached
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();

      // Set cache
      setCachedPermissionedDatasets('user1', 0, 20, result);

      // Should retrieve cached result
      const cached = getCachedPermissionedDatasets('user1', 0, 20);
      expect(cached).toEqual(result);
    });

    it('should handle different pagination keys', () => {
      const page1 = { datasets: [mockDatasets[0]], total: 2 };
      const page2 = { datasets: [mockDatasets[1]], total: 2 };

      setCachedPermissionedDatasets('user1', 0, 1, page1);
      setCachedPermissionedDatasets('user1', 1, 1, page2);

      expect(getCachedPermissionedDatasets('user1', 0, 1)).toEqual(page1);
      expect(getCachedPermissionedDatasets('user1', 1, 1)).toEqual(page2);
      expect(getCachedPermissionedDatasets('user1', 0, 2)).toBeUndefined();
    });

    it('should track cache stats', () => {
      const result = { datasets: mockDatasets, total: 2 };

      // Miss
      getCachedPermissionedDatasets('user1', 0, 20);
      let stats = getCacheStats();
      expect(stats.datasets.misses).toBe(1);

      // Set and hit
      setCachedPermissionedDatasets('user1', 0, 20, result);
      getCachedPermissionedDatasets('user1', 0, 20);
      stats = getCacheStats();
      expect(stats.datasets.hits).toBe(1);
      expect(stats.datasets.hitRate).toBe('50.00%');
    });
  });

  describe('Dataset Access Cache', () => {
    it('should cache and retrieve access results', () => {
      // Should return undefined for uncached
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();

      // Set cache
      setCachedDatasetAccess('user1', 'ds1', true);
      setCachedDatasetAccess('user1', 'ds2', false);

      // Should retrieve cached results
      expect(getCachedDatasetAccess('user1', 'ds1')).toBe(true);
      expect(getCachedDatasetAccess('user1', 'ds2')).toBe(false);
    });

    it('should track access cache stats separately', () => {
      // Miss
      getCachedDatasetAccess('user1', 'ds1');
      let stats = getCacheStats();
      expect(stats.access.misses).toBe(1);
      expect(stats.datasets.misses).toBe(0); // Different cache

      // Set and hit
      setCachedDatasetAccess('user1', 'ds1', true);
      getCachedDatasetAccess('user1', 'ds1');
      stats = getCacheStats();
      expect(stats.access.hits).toBe(1);
      expect(stats.access.hitRate).toBe('50.00%');
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Set up some cached data
      setCachedPermissionedDatasets('user1', 0, 20, { datasets: [], total: 0 });
      setCachedPermissionedDatasets('user1', 1, 20, { datasets: [], total: 0 });
      setCachedPermissionedDatasets('user2', 0, 20, { datasets: [], total: 0 });

      setCachedDatasetAccess('user1', 'ds1', true);
      setCachedDatasetAccess('user1', 'ds2', true);
      setCachedDatasetAccess('user2', 'ds1', true);
    });

    it('should invalidate all caches for a user', () => {
      invalidateUser('user1');

      // User1 caches should be cleared
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedPermissionedDatasets('user1', 1, 20)).toBeUndefined();
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();
      expect(getCachedDatasetAccess('user1', 'ds2')).toBeUndefined();

      // User2 caches should remain
      expect(getCachedPermissionedDatasets('user2', 0, 20)).toBeDefined();
      expect(getCachedDatasetAccess('user2', 'ds1')).toBeDefined();
    });

    it('should invalidate all caches for a dataset', () => {
      invalidateDataset('ds1');

      // All dataset list caches cleared (broad invalidation)
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedPermissionedDatasets('user2', 0, 20)).toBeUndefined();

      // Specific dataset access cleared
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();
      expect(getCachedDatasetAccess('user2', 'ds1')).toBeUndefined();

      // Other dataset access remains
      expect(getCachedDatasetAccess('user1', 'ds2')).toBeDefined();
    });

    it('should handle user permission changes', () => {
      invalidateOnPermissionChange('ds1', 'user1', 'user');

      // Should invalidate the dataset
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();
      expect(getCachedDatasetAccess('user2', 'ds1')).toBeUndefined();

      // Should invalidate all dataset lists (broad invalidation)
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedPermissionedDatasets('user2', 0, 20)).toBeUndefined();
    });

    it('should clear all caches for team/group permission changes', () => {
      const initialDatasets = getCachedPermissionedDatasets('user1', 0, 20);
      const initialAccess = getCachedDatasetAccess('user1', 'ds1');
      expect(initialDatasets).toBeDefined();
      expect(initialAccess).toBeDefined();

      // Team permission change
      invalidateOnPermissionChange('ds1', 'team1', 'team');

      // All caches should be cleared
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();

      // Set up new data
      setCachedPermissionedDatasets('user1', 0, 20, { datasets: [], total: 0 });
      setCachedDatasetAccess('user1', 'ds1', true);

      // Permission group change
      invalidateOnPermissionChange('ds1', 'group1', 'permission_group');

      // All caches should be cleared again
      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      setCachedPermissionedDatasets('user1', 0, 20, { datasets: [], total: 0 });
      setCachedDatasetAccess('user1', 'ds1', true);

      clearAllCaches();

      expect(getCachedPermissionedDatasets('user1', 0, 20)).toBeUndefined();
      expect(getCachedDatasetAccess('user1', 'ds1')).toBeUndefined();
    });

    it('should reset stats but keep cache data', () => {
      // Generate stats
      getCachedPermissionedDatasets('user1', 0, 20);
      setCachedPermissionedDatasets('user1', 0, 20, { datasets: [], total: 0 });
      getCachedPermissionedDatasets('user1', 0, 20);

      let stats = getCacheStats();
      expect(stats.datasets.hits).toBe(1);
      expect(stats.datasets.misses).toBe(1);

      resetCacheStats();
      stats = getCacheStats();
      expect(stats.datasets.hits).toBe(0);
      expect(stats.datasets.misses).toBe(0);
      expect(stats.datasets.size).toBe(1); // Data still cached
    });

    it('should respect cache size limits', () => {
      const stats = getCacheStats();
      expect(stats.datasets.maxSize).toBe(1000);
      expect(stats.access.maxSize).toBe(5000);
    });
  });
});
