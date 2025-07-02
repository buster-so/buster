import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUserAccessChatCached,
  getCacheStats,
  resetCacheStats,
  clearCache,
  invalidateAccess,
  invalidateUserAccess,
  invalidateChatAccess,
} from '../../src/chats-cached';

// Mock the original canUserAccessChat function
vi.mock('../../src/chats', () => ({
  canUserAccessChat: vi.fn(),
}));

describe('canUserAccessChatCached', () => {
  let mockCanUserAccessChat: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    clearCache();
    resetCacheStats();
    
    // Get the mocked function
    const chatsModule = await import('../../src/chats');
    mockCanUserAccessChat = vi.mocked(chatsModule.canUserAccessChat);
  });

  it('should return cached result on second call', async () => {
    // Setup
    mockCanUserAccessChat.mockResolvedValue(true);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // First call - should hit database
    const result1 = await canUserAccessChatCached({ userId, chatId });
    expect(result1).toBe(true);
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Second call - should hit cache
    const result2 = await canUserAccessChatCached({ userId, chatId });
    expect(result2).toBe(true);
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1); // Still 1, not called again

    // Check cache stats
    const stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('50.00%');
  });

  it('should cache false results', async () => {
    mockCanUserAccessChat.mockResolvedValue(false);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // First call
    const result1 = await canUserAccessChatCached({ userId, chatId });
    expect(result1).toBe(false);

    // Second call - should use cache
    const result2 = await canUserAccessChatCached({ userId, chatId });
    expect(result2).toBe(false);
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1);
  });

  it('should handle different user/chat combinations independently', async () => {
    const user1 = '123e4567-e89b-12d3-a456-426614174000';
    const user2 = '323e4567-e89b-12d3-a456-426614174000';
    const chat1 = '423e4567-e89b-12d3-a456-426614174000';
    const chat2 = '523e4567-e89b-12d3-a456-426614174000';

    // Setup different responses
    mockCanUserAccessChat
      .mockResolvedValueOnce(true)   // user1:chat1
      .mockResolvedValueOnce(false)  // user1:chat2
      .mockResolvedValueOnce(false)  // user2:chat1
      .mockResolvedValueOnce(true);  // user2:chat2

    // Make calls
    expect(await canUserAccessChatCached({ userId: user1, chatId: chat1 })).toBe(true);
    expect(await canUserAccessChatCached({ userId: user1, chatId: chat2 })).toBe(false);
    expect(await canUserAccessChatCached({ userId: user2, chatId: chat1 })).toBe(false);
    expect(await canUserAccessChatCached({ userId: user2, chatId: chat2 })).toBe(true);

    // All should be cached now
    expect(await canUserAccessChatCached({ userId: user1, chatId: chat1 })).toBe(true);
    expect(await canUserAccessChatCached({ userId: user1, chatId: chat2 })).toBe(false);
    expect(await canUserAccessChatCached({ userId: user2, chatId: chat1 })).toBe(false);
    expect(await canUserAccessChatCached({ userId: user2, chatId: chat2 })).toBe(true);

    // Should have called original function 4 times (once per unique combination)
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(4);
  });

  it('should invalidate specific user:chat combination', async () => {
    mockCanUserAccessChat.mockResolvedValue(true);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // Cache the result
    await canUserAccessChatCached({ userId, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Use cached result
    await canUserAccessChatCached({ userId, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Invalidate
    invalidateAccess(userId, chatId);

    // Should call database again
    await canUserAccessChatCached({ userId, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(2);
  });

  it('should invalidate all entries for a user', async () => {
    mockCanUserAccessChat.mockResolvedValue(true);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chat1 = '223e4567-e89b-12d3-a456-426614174000';
    const chat2 = '323e4567-e89b-12d3-a456-426614174000';
    const otherUserId = '423e4567-e89b-12d3-a456-426614174000';

    // Cache results for multiple chats
    await canUserAccessChatCached({ userId, chatId: chat1 });
    await canUserAccessChatCached({ userId, chatId: chat2 });
    await canUserAccessChatCached({ userId: otherUserId, chatId: chat1 });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(3);

    // Use cached results
    await canUserAccessChatCached({ userId, chatId: chat1 });
    await canUserAccessChatCached({ userId, chatId: chat2 });
    await canUserAccessChatCached({ userId: otherUserId, chatId: chat1 });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(3); // Still 3

    // Invalidate all entries for userId
    invalidateUserAccess(userId);

    // Should call database for invalidated user
    await canUserAccessChatCached({ userId, chatId: chat1 });
    await canUserAccessChatCached({ userId, chatId: chat2 });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(5); // +2

    // Other user should still be cached
    await canUserAccessChatCached({ userId: otherUserId, chatId: chat1 });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(5); // Still 5
  });

  it('should invalidate all entries for a chat', async () => {
    mockCanUserAccessChat.mockResolvedValue(true);
    const user1 = '123e4567-e89b-12d3-a456-426614174000';
    const user2 = '223e4567-e89b-12d3-a456-426614174000';
    const chatId = '323e4567-e89b-12d3-a456-426614174000';
    const otherChatId = '423e4567-e89b-12d3-a456-426614174000';

    // Cache results for multiple users
    await canUserAccessChatCached({ userId: user1, chatId });
    await canUserAccessChatCached({ userId: user2, chatId });
    await canUserAccessChatCached({ userId: user1, chatId: otherChatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(3);

    // Invalidate all entries for chatId
    invalidateChatAccess(chatId);

    // Should call database for invalidated chat
    await canUserAccessChatCached({ userId: user1, chatId });
    await canUserAccessChatCached({ userId: user2, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(5); // +2

    // Other chat should still be cached
    await canUserAccessChatCached({ userId: user1, chatId: otherChatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(5); // Still 5
  });

  it('should clear entire cache', async () => {
    mockCanUserAccessChat.mockResolvedValue(true);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // Cache a result
    await canUserAccessChatCached({ userId, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(1);

    // Clear cache
    clearCache();

    // Should call database again
    await canUserAccessChatCached({ userId, chatId });
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(2);
  });

  it('should track cache statistics correctly', async () => {
    mockCanUserAccessChat.mockResolvedValue(true);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // Initial stats
    let stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.total).toBe(0);
    expect(stats.hitRate).toBe('0.00%');
    expect(stats.size).toBe(0);

    // First call - miss
    await canUserAccessChatCached({ userId, chatId });
    stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('0.00%');
    expect(stats.size).toBe(1);

    // Second call - hit
    await canUserAccessChatCached({ userId, chatId });
    stats = getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('50.00%');

    // Third call - hit
    await canUserAccessChatCached({ userId, chatId });
    stats = getCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('66.67%');

    // Reset stats
    resetCacheStats();
    stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(1); // Cache still has entries
  });

  it('should handle errors from the original function', async () => {
    const error = new Error('Database error');
    mockCanUserAccessChat.mockRejectedValue(error);
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const chatId = '223e4567-e89b-12d3-a456-426614174000';

    // Should propagate the error
    await expect(canUserAccessChatCached({ userId, chatId })).rejects.toThrow('Database error');

    // Should not cache errors
    mockCanUserAccessChat.mockResolvedValue(true);
    const result = await canUserAccessChatCached({ userId, chatId });
    expect(result).toBe(true);
    expect(mockCanUserAccessChat).toHaveBeenCalledTimes(2); // Called again, error wasn't cached
  });
});