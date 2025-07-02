import { LRUCache } from 'lru-cache';
import { canUserAccessChat } from './chats';

// Cache configuration
const cache = new LRUCache<string, boolean>({
  max: 10000, // Maximum 10k entries
  ttl: 30 * 1000, // 30 seconds
  updateAgeOnGet: true, // Refresh TTL on access
});

// Metrics
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Cached version of canUserAccessChat
 * Caches the boolean result for userId:chatId for 30 seconds
 * TTL is refreshed on each access
 */
export async function canUserAccessChatCached({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}): Promise<boolean> {
  const cacheKey = `${userId}:${chatId}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    cacheHits++;
    return cached;
  }

  // Cache miss - call the original function
  cacheMisses++;
  const hasAccess = await canUserAccessChat({ userId, chatId });

  // Store the boolean result
  cache.set(cacheKey, hasAccess);

  return hasAccess;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: `${hitRate.toFixed(2)}%`,
    size: cache.size,
    maxSize: cache.max,
  };
}

/**
 * Clear cache statistics (useful for testing)
 */
export function resetCacheStats() {
  cacheHits = 0;
  cacheMisses = 0;
}

/**
 * Clear the entire cache (useful for testing)
 */
export function clearCache() {
  cache.clear();
}

/**
 * Invalidate a specific user:chat combination
 */
export function invalidateAccess(userId: string, chatId: string) {
  const cacheKey = `${userId}:${chatId}`;
  cache.delete(cacheKey);
}

/**
 * Invalidate all cached entries for a specific user
 */
export function invalidateUserAccess(userId: string) {
  for (const key of Array.from(cache.keys())) {
    if (key.startsWith(`${userId}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all cached entries for a specific chat
 */
export function invalidateChatAccess(chatId: string) {
  for (const key of Array.from(cache.keys())) {
    if (key.endsWith(`:${chatId}`)) {
      cache.delete(key);
    }
  }
}
