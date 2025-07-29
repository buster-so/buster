import { LRUCache } from 'lru-cache';
import type { DatasetAccessPath, PermissionedDataset } from '../types/dataset-permissions';

// Cache for dataset permissions - stores arrays of accessible datasets per user
const datasetCache = new LRUCache<
  string,
  {
    datasets: PermissionedDataset[];
    total: number;
  }
>({
  max: 1000, // Maximum 1k entries
  ttl: 30 * 1000, // 30 seconds
  updateAgeOnGet: true,
});

// Cache for individual dataset access checks
interface CachedDatasetAccess {
  hasAccess: boolean;
  accessPath?: DatasetAccessPath;
  userRole?: string;
}

const accessCache = new LRUCache<string, CachedDatasetAccess>({
  max: 5000, // Maximum 5k entries
  ttl: 30 * 1000, // 30 seconds
  updateAgeOnGet: true,
});

// Metrics
let datasetCacheHits = 0;
let datasetCacheMisses = 0;
let accessCacheHits = 0;
let accessCacheMisses = 0;

/**
 * Get cached permissioned datasets for a user
 */
export function getCachedPermissionedDatasets(
  userId: string,
  page: number,
  pageSize: number
): { datasets: PermissionedDataset[]; total: number } | undefined {
  const key = `datasets:${userId}:${page}:${pageSize}`;
  const cached = datasetCache.get(key);

  if (cached !== undefined) {
    datasetCacheHits++;
    return cached;
  }

  datasetCacheMisses++;
  return undefined;
}

/**
 * Set cached permissioned datasets for a user
 */
export function setCachedPermissionedDatasets(
  userId: string,
  page: number,
  pageSize: number,
  result: { datasets: PermissionedDataset[]; total: number }
): void {
  const key = `datasets:${userId}:${page}:${pageSize}`;
  datasetCache.set(key, result);
}

/**
 * Get cached dataset access check result
 */
export function getCachedDatasetAccess(
  userId: string,
  datasetId: string
): CachedDatasetAccess | undefined {
  const key = `access:${userId}:${datasetId}`;
  const cached = accessCache.get(key);

  if (cached !== undefined) {
    accessCacheHits++;
    return cached;
  }

  accessCacheMisses++;
  return undefined;
}

/**
 * Set cached dataset access check result
 */
export function setCachedDatasetAccess(
  userId: string,
  datasetId: string,
  accessResult: CachedDatasetAccess
): void {
  const key = `access:${userId}:${datasetId}`;
  accessCache.set(key, accessResult);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const datasetTotal = datasetCacheHits + datasetCacheMisses;
  const datasetHitRate = datasetTotal > 0 ? (datasetCacheHits / datasetTotal) * 100 : 0;

  const accessTotal = accessCacheHits + accessCacheMisses;
  const accessHitRate = accessTotal > 0 ? (accessCacheHits / accessTotal) * 100 : 0;

  return {
    datasets: {
      hits: datasetCacheHits,
      misses: datasetCacheMisses,
      total: datasetTotal,
      hitRate: `${datasetHitRate.toFixed(2)}%`,
      size: datasetCache.size,
      maxSize: datasetCache.max,
    },
    access: {
      hits: accessCacheHits,
      misses: accessCacheMisses,
      total: accessTotal,
      hitRate: `${accessHitRate.toFixed(2)}%`,
      size: accessCache.size,
      maxSize: accessCache.max,
    },
  };
}

/**
 * Clear cache statistics (useful for testing)
 */
export function resetCacheStats() {
  datasetCacheHits = 0;
  datasetCacheMisses = 0;
  accessCacheHits = 0;
  accessCacheMisses = 0;
}

/**
 * Clear all caches (useful for testing)
 */
export function clearAllCaches() {
  datasetCache.clear();
  accessCache.clear();
}

/**
 * Invalidate all cached entries for a specific user
 */
export function invalidateUser(userId: string) {
  // Invalidate dataset list cache
  for (const key of Array.from(datasetCache.keys())) {
    if (key.startsWith(`datasets:${userId}:`)) {
      datasetCache.delete(key);
    }
  }

  // Invalidate access cache
  for (const key of Array.from(accessCache.keys())) {
    if (key.startsWith(`access:${userId}:`)) {
      accessCache.delete(key);
    }
  }
}

/**
 * Invalidate all cached entries for a specific dataset
 */
export function invalidateDataset(datasetId: string) {
  // Clear all dataset list caches (broad invalidation)
  datasetCache.clear();

  // Invalidate specific dataset access checks
  for (const key of Array.from(accessCache.keys())) {
    if (key.endsWith(`:${datasetId}`)) {
      accessCache.delete(key);
    }
  }
}

/**
 * Invalidate cache when dataset permissions change
 */
export function invalidateOnPermissionChange(
  datasetId: string,
  identityId?: string,
  identityType?: 'user' | 'team' | 'permission_group'
) {
  // Always invalidate the dataset
  invalidateDataset(datasetId);

  // If it's a user permission, invalidate that user specifically
  if (identityType === 'user' && identityId) {
    invalidateUser(identityId);
  }

  // For team and permission group changes, do broad invalidation
  // since we don't track team/group membership in the cache key
  if (identityType === 'team' || identityType === 'permission_group') {
    datasetCache.clear();
    accessCache.clear();
  }
}
