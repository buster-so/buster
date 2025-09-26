import type { AssetType } from '@buster/database/schema-types';
import { LRUCache } from 'lru-cache';
import type { AssetPermissionRole } from '../types';
import type { AssetPermissionResult } from './checks';

// Cache key format: userId:assetId:assetType:requiredRole
type CacheKey = string;

// Permission cache - stores the full permission result
const permissionCache = new LRUCache<CacheKey, AssetPermissionResult>({
  max: 10000, // Maximum 10k entries
  ttl: 10 * 1000, // 10 seconds
  updateAgeOnGet: true, // Refresh TTL on access
});

// Cascading permission cache - stores boolean results for cascading checks
const cascadingCache = new LRUCache<string, boolean>({
  max: 5000, // Maximum 5k entries
  ttl: 10 * 1000, // 10 seconds
  updateAgeOnGet: true,
});

// Metrics
let permissionCacheHits = 0;
let permissionCacheMisses = 0;
let cascadingCacheHits = 0;
let cascadingCacheMisses = 0;

/**
 * Generate cache key for permission checks
 */
export function getPermissionCacheKey(
  userId: string,
  assetId: string,
  assetType: AssetType,
  requiredRole: AssetPermissionRole,
  password?: string
): CacheKey {
  if (password) {
    return `${userId}:${assetId}:${assetType}:${requiredRole}:${password}`;
  }
  return `${userId}:${assetId}:${assetType}:${requiredRole}`;
}

/**
 * Get cached permission result
 */
export function getCachedPermission(
  userId: string,
  assetId: string,
  assetType: AssetType,
  requiredRole: AssetPermissionRole,
  password?: string
): AssetPermissionResult | undefined {
  const key = getPermissionCacheKey(userId, assetId, assetType, requiredRole, password);
  const cached = permissionCache.get(key);

  if (cached !== undefined) {
    permissionCacheHits++;
    return cached;
  }

  permissionCacheMisses++;
  return undefined;
}

/**
 * Set cached permission result
 */
export function setCachedPermission(
  userId: string,
  assetId: string,
  assetType: AssetType,
  requiredRole: AssetPermissionRole,
  result: AssetPermissionResult,
  password?: string
): void {
  const key = getPermissionCacheKey(userId, assetId, assetType, requiredRole, password);
  permissionCache.set(key, result);
}

/**
 * Get cached cascading permission result
 */
export function getCachedCascadingPermission(
  userId: string,
  assetId: string,
  assetType: AssetType
): boolean | undefined {
  const key = `cascading:${userId}:${assetId}:${assetType}`;
  const cached = cascadingCache.get(key);

  if (cached !== undefined) {
    cascadingCacheHits++;
    return cached;
  }

  cascadingCacheMisses++;
  return undefined;
}

/**
 * Set cached cascading permission result
 */
export function setCachedCascadingPermission(
  userId: string,
  assetId: string,
  assetType: AssetType,
  hasAccess: boolean
): void {
  const key = `cascading:${userId}:${assetId}:${assetType}`;
  cascadingCache.set(key, hasAccess);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const permissionTotal = permissionCacheHits + permissionCacheMisses;
  const permissionHitRate = permissionTotal > 0 ? (permissionCacheHits / permissionTotal) * 100 : 0;

  const cascadingTotal = cascadingCacheHits + cascadingCacheMisses;
  const cascadingHitRate = cascadingTotal > 0 ? (cascadingCacheHits / cascadingTotal) * 100 : 0;

  return {
    permission: {
      hits: permissionCacheHits,
      misses: permissionCacheMisses,
      total: permissionTotal,
      hitRate: `${permissionHitRate.toFixed(2)}%`,
      size: permissionCache.size,
      maxSize: permissionCache.max,
    },
    cascading: {
      hits: cascadingCacheHits,
      misses: cascadingCacheMisses,
      total: cascadingTotal,
      hitRate: `${cascadingHitRate.toFixed(2)}%`,
      size: cascadingCache.size,
      maxSize: cascadingCache.max,
    },
  };
}

/**
 * Clear cache statistics (useful for testing)
 */
export function resetCacheStats() {
  permissionCacheHits = 0;
  permissionCacheMisses = 0;
  cascadingCacheHits = 0;
  cascadingCacheMisses = 0;
}

/**
 * Clear all caches (useful for testing)
 */
export function clearAllCaches() {
  permissionCache.clear();
  cascadingCache.clear();
}

/**
 * Invalidate all cached entries for a specific asset
 */
export function invalidateAsset(assetId: string, assetType: AssetType) {
  // Invalidate permission cache entries
  for (const key of Array.from(permissionCache.keys())) {
    if (key.includes(`:${assetId}:${assetType}:`)) {
      permissionCache.delete(key);
    }
  }

  // Invalidate cascading cache entries
  for (const key of Array.from(cascadingCache.keys())) {
    if (key.includes(`:${assetId}:${assetType}`)) {
      cascadingCache.delete(key);
    }
  }
}

/**
 * Invalidate all cached entries for a specific user
 */
export function invalidateUser(userId: string) {
  // Invalidate permission cache entries
  for (const key of Array.from(permissionCache.keys())) {
    if (key.startsWith(`${userId}:`)) {
      permissionCache.delete(key);
    }
  }

  // Invalidate cascading cache entries
  for (const key of Array.from(cascadingCache.keys())) {
    if (key.includes(`:${userId}:`)) {
      cascadingCache.delete(key);
    }
  }
}

/**
 * Invalidate all cached entries for a user-asset combination
 */
export function invalidateUserAsset(userId: string, assetId: string, assetType: AssetType) {
  // Invalidate all permission levels for this user-asset combination
  const permissionRoles: AssetPermissionRole[] = [
    'owner',
    'full_access',
    'can_edit',
    'can_filter',
    'can_view',
  ];

  for (const role of permissionRoles) {
    const key = getPermissionCacheKey(userId, assetId, assetType, role);
    permissionCache.delete(key);
  }

  // Invalidate cascading cache
  const cascadingKey = `cascading:${userId}:${assetId}:${assetType}`;
  cascadingCache.delete(cascadingKey);
}

/**
 * Invalidate caches when a permission is created or updated
 * This should be called whenever permissions change
 */
export function invalidateOnPermissionChange(
  identityId: string,
  identityType: 'user' | 'team' | 'organization',
  assetId: string,
  assetType: AssetType
) {
  if (identityType === 'user') {
    invalidateUserAsset(identityId, assetId, assetType);
  } else {
    // For team permissions, we need to invalidate all team members
    // This is a broad invalidation - in production, you might want to
    // query team members and invalidate specifically
    invalidateAsset(assetId, assetType);
  }

  // Also invalidate cascading permissions for related assets
  // For example, if a dashboard permission changes, invalidate metrics in that dashboard
  invalidateCascadingRelatedAssets(assetId, assetType);
}

/**
 * Invalidate cascading permissions for related assets
 */
function invalidateCascadingRelatedAssets(_assetId: string, assetType: AssetType) {
  // When a collection permission changes, invalidate all cascading caches
  // for assets that might be in that collection
  if (assetType === 'collection') {
    // Broad invalidation of cascading cache for collections
    for (const key of Array.from(cascadingCache.keys())) {
      if (key.startsWith('cascading:')) {
        cascadingCache.delete(key);
      }
    }
  }

  // When a dashboard permission changes, invalidate metric cascading caches
  if (assetType === 'dashboard_file') {
    for (const key of Array.from(cascadingCache.keys())) {
      if (key.includes(':metric') || key.includes(':metric_file')) {
        cascadingCache.delete(key);
      }
    }
  }

  // When a chat permission changes, invalidate metric and dashboard cascading caches
  if (assetType === 'chat') {
    for (const key of Array.from(cascadingCache.keys())) {
      if (
        key.includes(':metric') ||
        key.includes(':metric_file') ||
        key.includes(':dashboard') ||
        key.includes(':dashboard_file')
      ) {
        cascadingCache.delete(key);
      }
    }
  }
}
