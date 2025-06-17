import { describe, expect, it } from 'vitest';
import type { BusterChat } from '@/api/asset_interfaces/chat';
import { MOCK_CHAT } from '@/mocks/MOCK_CHAT';
import { updateChatToIChat } from './chat';

describe('updateChatToIChat', () => {
  it('should correctly upgrade a chat with no messages', () => {
    const mockChat: BusterChat = {
      ...MOCK_CHAT(),
      message_ids: [],
      messages: {}
    };

    const { iChat, iChatMessages } = updateChatToIChat(mockChat);

    expect(iChat.message_ids).toHaveLength(0);

    expect(Object.keys(iChatMessages)).toHaveLength(0);
  });
  it('should correctly upgrade a chat with existing messages when not new', () => {
    const mockChat = MOCK_CHAT();
    const { iChat, iChatMessages } = updateChatToIChat(mockChat);

    expect(Object.keys(iChatMessages)).toHaveLength(mockChat.message_ids.length);
  });

  it('should preserve all chat properties except messages when upgrading', () => {
    const mockChat = MOCK_CHAT();
    const { iChat } = updateChatToIChat(mockChat);

    // Verify all properties except 'messages' are preserved
    expect(iChat.id).toBe(mockChat.id);
    expect(iChat.title).toBe(mockChat.title);
    expect(iChat.is_favorited).toBe(mockChat.is_favorited);
    expect(iChat.message_ids).toEqual(mockChat.message_ids);
    expect(iChat.created_at).toBe(mockChat.created_at);
    expect(iChat.updated_at).toBe(mockChat.updated_at);
    expect(iChat.created_by).toBe(mockChat.created_by);
    expect(iChat.created_by_id).toBe(mockChat.created_by_id);
    expect(iChat.created_by_name).toBe(mockChat.created_by_name);
    expect(iChat.created_by_avatar).toBe(mockChat.created_by_avatar);
    // Verify messages property is removed
    expect('messages' in iChat).toBe(false);
  });
  it('should maintain message order when upgrading messages', () => {
    const mockChat = MOCK_CHAT();
    const { iChatMessages } = updateChatToIChat(mockChat);

    // Verify that all messages exist and maintain their original properties
    mockChat.message_ids.forEach((messageId) => {
      const originalMessage = mockChat.messages[messageId];
      const upgradedMessage = iChatMessages[messageId];

      expect(upgradedMessage).toBeDefined();
      expect(upgradedMessage.id).toBe(originalMessage.id);
      expect(upgradedMessage.request_message).toEqual(originalMessage.request_message);
      expect(upgradedMessage.response_message_ids).toEqual(originalMessage.response_message_ids);
      expect(upgradedMessage.response_messages).toEqual(originalMessage.response_messages);
      expect(upgradedMessage.reasoning_message_ids).toEqual(originalMessage.reasoning_message_ids);
      expect(upgradedMessage.reasoning_messages).toEqual(originalMessage.reasoning_messages);
      expect(upgradedMessage.created_at).toBe(originalMessage.created_at);
      expect(upgradedMessage.final_reasoning_message).toBe(originalMessage.final_reasoning_message);
      expect(upgradedMessage.feedback).toBe(originalMessage.feedback);
    });
  });
  it('should handle a chat with a single message correctly', () => {
    const fullMockChat = MOCK_CHAT();
    // Modify the mock to only have one message
    const singleMessageId = fullMockChat.message_ids[0];
    const mockChat: BusterChat = {
      ...fullMockChat,
      message_ids: [singleMessageId],
      messages: {
        [singleMessageId]: fullMockChat.messages[singleMessageId]
      }
    };

    // Test both new and existing chat scenarios
    const { iChatMessages: existingChatMessages } = updateChatToIChat(mockChat);
    const { iChatMessages: newChatMessages } = updateChatToIChat(mockChat);

    // For existing chat, the single message should be marked as completed
    expect(Object.keys(existingChatMessages)).toHaveLength(1);

    // For new chat, the single message should be marked as incomplete
    expect(Object.keys(newChatMessages)).toHaveLength(1);
  });
});
