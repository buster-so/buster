import type { BusterChat } from '@/api/asset_interfaces/chat';
import { MOCK_CHAT } from '@/mocks/MOCK_CHAT';
import { updateChatToIChat } from './chat';

describe('updateChatToIChat', () => {
  test('should correctly upgrade a chat with no messages', () => {
    const mockChat: BusterChat = {
      ...MOCK_CHAT(),
      message_ids: [],
      messages: {}
    };

    const { iChat, iChatMessages } = updateChatToIChat(mockChat, false);

    expect(iChat.message_ids).toHaveLength(0);
    expect(iChat.isNewChat).toBe(false);
    expect(Object.keys(iChatMessages)).toHaveLength(0);
  });

  test('should correctly upgrade a chat with existing messages when not new', () => {
    const mockChat = MOCK_CHAT();
    const { iChat, iChatMessages } = updateChatToIChat(mockChat, false);

    expect(iChat.isNewChat).toBe(false);
    expect(Object.keys(iChatMessages)).toHaveLength(mockChat.message_ids.length);
    // All messages should be marked as completed stream
    Object.values(iChatMessages).forEach((message) => {
      expect(message.isCompletedStream).toBe(true);
    });
  });

  test('should mark the last message as incomplete stream when isNewChat is true', () => {
    const mockChat = MOCK_CHAT();
    const { iChat, iChatMessages } = updateChatToIChat(mockChat, true);

    expect(iChat.isNewChat).toBe(true);
    expect(Object.keys(iChatMessages)).toHaveLength(mockChat.message_ids.length);

    // All messages except the last one should be completed
    const messageIds = mockChat.message_ids;
    messageIds.forEach((messageId, index) => {
      const isLastMessage = index === messageIds.length - 1;
      expect(iChatMessages[messageId].isCompletedStream).toBe(!isLastMessage);
    });
  });

  test('should preserve all chat properties except messages when upgrading', () => {
    const mockChat = MOCK_CHAT();
    const { iChat } = updateChatToIChat(mockChat, false);

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

  test('should maintain message order when upgrading messages', () => {
    const mockChat = MOCK_CHAT();
    const { iChatMessages } = updateChatToIChat(mockChat, false);

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

  test('should handle a chat with a single message correctly', () => {
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
    const { iChatMessages: existingChatMessages } = updateChatToIChat(mockChat, false);
    const { iChatMessages: newChatMessages } = updateChatToIChat(mockChat, true);

    // For existing chat, the single message should be marked as completed
    expect(Object.keys(existingChatMessages)).toHaveLength(1);
    expect(existingChatMessages[singleMessageId].isCompletedStream).toBe(true);

    // For new chat, the single message should be marked as incomplete
    expect(Object.keys(newChatMessages)).toHaveLength(1);
    expect(newChatMessages[singleMessageId].isCompletedStream).toBe(false);
  });
});
