import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { canUserAccessChat } from '../../src/chats';
import {
  canUserAccessChatCached,
  clearCache,
  getCacheStats,
  resetCacheStats,
} from '../../src/chats-cached';

// We'll use real function but spy on it to count calls
vi.mock('../../src/chats', async () => {
  const actual = await vi.importActual<typeof import('../../src/chats')>('../../src/chats');
  return {
    canUserAccessChat: vi.fn(actual.canUserAccessChat),
  };
});

describe('canUserAccessChatCached Integration Tests', () => {
  let spiedCanUserAccessChat: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    clearCache();
    resetCacheStats();

    const chatsModule = await import('../../src/chats');
    spiedCanUserAccessChat = vi.mocked(chatsModule.canUserAccessChat);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should cache results and reduce database calls', async () => {
    // Use non-existent IDs so we get consistent false results
    const userId = '00000000-0000-0000-0000-000000000001';
    const chatId = '00000000-0000-0000-0000-000000000002';

    // First call - should hit database
    const result1 = await canUserAccessChatCached({ userId, chatId });
    expect(result1).toBe(false);
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Make 10 more calls - all should hit cache
    for (let i = 0; i < 10; i++) {
      const result = await canUserAccessChatCached({ userId, chatId });
      expect(result).toBe(false);
    }

    // Should still only have called database once
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Check stats
    const stats = getCacheStats();
    expect(stats.hits).toBe(10);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('90.91%');
  });

  test('should handle multiple concurrent requests efficiently', async () => {
    const userId = '00000000-0000-0000-0000-000000000003';
    const chatId = '00000000-0000-0000-0000-000000000004';

    // Make 5 concurrent requests
    const promises = Array(5)
      .fill(null)
      .map(() => canUserAccessChatCached({ userId, chatId }));

    const results = await Promise.all(promises);

    // All should return false
    for (const result of results) {
      expect(result).toBe(false);
    }

    // Should only call database once even with concurrent requests
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Stats might vary due to race conditions, but we should have some hits
    const stats = getCacheStats();
    expect(stats.total).toBe(5);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
    expect(stats.hits).toBeLessThanOrEqual(4);
  });

  test('should simulate high-frequency burst scenario', async () => {
    // Simulate 100 requests across 3 users and 3 chats
    const users = [
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000003',
    ];
    const chats = [
      '40000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000002',
      '60000000-0000-0000-0000-000000000003',
    ];

    const startTime = Date.now();
    let totalRequests = 0;

    // Simulate requests
    for (let i = 0; i < 100; i++) {
      const userId = users[i % users.length];
      const chatId = chats[Math.floor(i / 33) % chats.length];

      await canUserAccessChatCached({ userId, chatId });
      totalRequests++;
    }

    const duration = Date.now() - startTime;

    // Should complete quickly due to caching
    expect(duration).toBeLessThan(500); // 500ms for 100 requests

    // Check cache effectiveness
    const stats = getCacheStats();
    expect(stats.total).toBe(100);

    // Should have at most 9 unique combinations (3 users × 3 chats)
    expect(spiedCanUserAccessChat.mock.calls.length).toBeLessThanOrEqual(9);

    // Cache hit rate should be high
    const hitRate = Number.parseFloat(stats.hitRate);
    expect(hitRate).toBeGreaterThan(80); // At least 80% hit rate
  });

  test('should expire cache entries after TTL', async () => {
    // This test verifies TTL behavior by using fake timers
    vi.useFakeTimers();

    const userId = '00000000-0000-0000-0000-000000000005';
    const chatId = '00000000-0000-0000-0000-000000000006';

    // Initial call
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Call again immediately - should use cache
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Advance time by 20 seconds - should still use cache
    vi.advanceTimersByTime(20 * 1000);
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Advance time to just over 30 seconds total - cache should expire
    vi.advanceTimersByTime(11 * 1000); // Total: 31 seconds
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(2);

    // Next call should use new cache entry
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(2);
  });

  test('should refresh TTL on access', async () => {
    // This test verifies that TTL is refreshed when updateAgeOnGet is true
    vi.useFakeTimers();

    const userId = '00000000-0000-0000-0000-000000000007';
    const chatId = '00000000-0000-0000-0000-000000000008';

    // Initial call
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1);

    // After 25 seconds, access the cache
    vi.advanceTimersByTime(25 * 1000);
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1); // Still cached

    // After another 25 seconds (total 50 seconds), should still be cached
    // because the TTL was refreshed at 25 seconds
    vi.advanceTimersByTime(25 * 1000);
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(1); // Still cached

    // After another 31 seconds (total 81 seconds), should expire
    // because last access was at 50 seconds, so 50 + 31 > 30 second TTL
    vi.advanceTimersByTime(31 * 1000);
    await canUserAccessChatCached({ userId, chatId });
    expect(spiedCanUserAccessChat).toHaveBeenCalledTimes(2); // Expired, fetched again
  });
});
