import { describe, expect, it } from 'vitest';
import { getChatHistory, getRawLlmMessages } from '../../../src/steps/get-chat-history';

describe('getChatHistory Integration Tests', () => {
  const testChatId = '6119c6ba-3488-4b3e-9629-bfc7427ed3f6';

  it('should fetch chat history with full message data', async () => {
    const result = await getChatHistory(testChatId);

    // Verify we get results - should have at least 2 messages for this chat
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);

    // Verify structure of returned data
    if (result.length === 0) {
      throw new Error('Expected at least one message');
    }
    const firstMessage = result[0]!;
    expect(firstMessage).toHaveProperty('messageId');
    expect(firstMessage).toHaveProperty('rawLlmMessages');
    expect(firstMessage).toHaveProperty('createdAt');

    // Verify types
    expect(typeof firstMessage.messageId).toBe('string');
    expect(firstMessage.createdAt).toBeInstanceOf(Date);
    expect(firstMessage.rawLlmMessages).toBeDefined();
    expect(Array.isArray(firstMessage.rawLlmMessages)).toBe(true);

    // Verify chronological order
    if (result.length > 1) {
      const firstTimestamp = result[0]!.createdAt;
      const secondMessage = result[1];
      if (!secondMessage) {
        throw new Error('Expected second message to be defined');
      }
      const secondTimestamp = secondMessage.createdAt;
      expect(firstTimestamp.getTime()).toBeLessThanOrEqual(secondTimestamp.getTime());
    }

    // Verify rawLlmMessages structure - should contain conversation messages
    const rawMessages = firstMessage.rawLlmMessages;
    expect(rawMessages.length).toBeGreaterThan(0);

    // Check that messages have expected structure (role, content, etc.)
    const firstRawMessage = rawMessages[0];
    if (!firstRawMessage) {
      throw new Error('Expected at least one raw message');
    }
    expect(firstRawMessage).toHaveProperty('role');
    expect(typeof firstRawMessage.role).toBe('string');

    // Should have either content or tool_calls
    const hasContent = 'content' in firstRawMessage;
    const hasToolCalls = 'tool_calls' in firstRawMessage;
    expect(hasContent || hasToolCalls).toBe(true);
  });

  it('should fetch raw LLM messages only', async () => {
    const result = await getRawLlmMessages(testChatId);

    // Verify we get results - should have at least 2 messages for this chat
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);

    // Verify each item is the raw LLM messages data (should be arrays of message objects)
    for (const rawLlmMessage of result) {
      expect(rawLlmMessage).toBeDefined();
      expect(Array.isArray(rawLlmMessage)).toBe(true);
      expect(rawLlmMessage.length).toBeGreaterThan(0);

      // Check first message in the conversation has expected structure
      const firstMsg = rawLlmMessage[0];
      if (firstMsg) {
        expect(firstMsg).toHaveProperty('role');
        expect(typeof firstMsg.role).toBe('string');
        expect(['user', 'assistant', 'tool'].includes(firstMsg.role)).toBe(true);
      }
    }
  });

  it('should return consistent data between both functions', async () => {
    const fullHistory = await getChatHistory(testChatId);
    const rawMessagesOnly = await getRawLlmMessages(testChatId);

    // Both should return the same number of items
    expect(fullHistory.length).toBe(rawMessagesOnly.length);

    // The raw messages should match between the two functions
    fullHistory.forEach((fullMessage, index) => {
      const rawMessage = rawMessagesOnly[index];
      if (rawMessage !== undefined) {
        expect(fullMessage.rawLlmMessages).toEqual(rawMessage);
      }
    });
  });

  it('should handle empty results gracefully', async () => {
    // Test with a non-existent chat ID
    const nonExistentChatId = '00000000-0000-0000-0000-000000000000';

    const fullHistory = await getChatHistory(nonExistentChatId);
    const rawMessages = await getRawLlmMessages(nonExistentChatId);

    expect(fullHistory).toEqual([]);
    expect(rawMessages).toEqual([]);
  });
});
