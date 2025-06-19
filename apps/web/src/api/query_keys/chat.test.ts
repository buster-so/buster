import { describe, expect, it } from 'vitest';
import { chatQueryKeys } from './chat';

describe('chatQueryKeys', () => {
  describe('chatsGetChat', () => {
    it('should return correct query options configuration', () => {
      const chatId = 'test-chat-123';
      const result = chatQueryKeys.chatsGetChat(chatId);

      expect(result.queryKey).toEqual(['chats', 'get', chatId]);
      expect(result.enabled).toBe(true);
      expect(result.staleTime).toBe(60 * 1000); // 1 minute in milliseconds
    });
  });
});
