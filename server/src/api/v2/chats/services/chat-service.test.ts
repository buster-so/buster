import type { Chat, Message } from '@buster/database/src/helpers/chats';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatError, ChatErrorCode } from '../../../../types/chat-types';
import { buildChatWithMessages, handleAssetChat, initializeChat } from './chat-service';

// Mock database functions
vi.mock('@buster/database', () => ({
  db: vi.fn(),
  createChat: vi.fn(),
  getChatWithDetails: vi.fn(),
  createMessage: vi.fn(),
  checkChatPermission: vi.fn(),
  generateAssetMessages: vi.fn(),
  getMessagesForChat: vi.fn()
}));

// Import mocked functions
import {
  checkChatPermission,
  createChat,
  createMessage,
  generateAssetMessages,
  getChatWithDetails,
  getMessagesForChat
} from '@buster/database';

describe('chat-service', () => {
  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      organization_id: '550e8400-e29b-41d4-a716-446655440000',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User;

  const mockChat: Chat = {
    id: 'chat-123',
    title: 'Test Chat',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    createdBy: '550e8400-e29b-41d4-a716-446655440001',
    updatedBy: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publiclyAccessible: false,
    deletedAt: null,
    publiclyEnabledBy: null,
    publicExpiryDate: null,
    mostRecentFileId: null,
    mostRecentFileType: null,
    mostRecentVersionNumber: null
  };

  const mockMessage: Message = {
    id: 'msg-123',
    chatId: 'chat-123',
    createdBy: 'user-123',
    requestMessage: 'Test message',
    responseMessages: {},
    reasoning: {},
    title: 'Test message',
    rawLlmMessages: {},
    finalReasoningMessage: null,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    feedback: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildChatWithMessages', () => {
    it('should build a ChatWithMessages object from database entities', () => {
      const result = buildChatWithMessages(
        mockChat,
        [mockMessage],
        mockUser,
        { name: 'Test User', avatarUrl: 'https://example.com/avatar.jpg' },
        true
      );

      expect(result).toMatchObject({
        id: 'chat-123',
        title: 'Test Chat',
        is_favorited: true,
        message_ids: ['msg-123'],
        created_by: 'user-123',
        created_by_id: 'user-123',
        created_by_name: 'Test User',
        created_by_avatar: 'https://example.com/avatar.jpg',
        publicly_accessible: false,
        permission: 'owner'
      });

      expect(result.messages['msg-123']).toMatchObject({
        id: 'msg-123',
        role: 'user',
        request_message: {
          request: 'Test message',
          sender_id: 'user-123',
          sender_name: 'Test User',
          sender_avatar: 'https://example.com/avatar.jpg'
        }
      });
    });

    it('should handle missing creator details', () => {
      const result = buildChatWithMessages(mockChat, [], mockUser, null, false);

      expect(result.created_by_name).toBe('Unknown User');
      expect(result.created_by_avatar).toBeUndefined();
    });
  });

  describe('initializeChat', () => {
    it('should create a new chat when chat_id is not provided', async () => {
      vi.mocked(createChat).mockResolvedValue(mockChat);
      vi.mocked(createMessage).mockResolvedValue(mockMessage);

      const result = await initializeChat({ prompt: 'Hello' }, mockUser, '550e8400-e29b-41d4-a716-446655440000');

      expect(createChat).toHaveBeenCalledWith({
        title: 'Hello',
        userId: 'user-123',
        organizationId: 'org-123'
      });
      expect(createMessage).toHaveBeenCalledWith({
        chatId: 'chat-123',
        content: 'Hello',
        userId: 'user-123',
        messageId: expect.any(String)
      });
      expect(result.chatId).toBe('chat-123');
      expect(result.chat.title).toBe('Test Chat');
    });

    it('should add message to existing chat when chat_id is provided', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(true);
      vi.mocked(getChatWithDetails).mockResolvedValue({
        chat: mockChat,
        user: { id: 'user-123', name: 'Test User', avatarUrl: null } as any,
        isFavorited: false
      });
      vi.mocked(getMessagesForChat).mockResolvedValue([mockMessage]);
      vi.mocked(createMessage).mockResolvedValue({
        ...mockMessage,
        id: 'msg-456',
        requestMessage: 'Follow up'
      });

      const result = await initializeChat({ chat_id: 'chat-123', prompt: 'Follow up' }, mockUser, 'org-123');

      expect(checkChatPermission).toHaveBeenCalledWith('chat-123', 'user-123');
      expect(createMessage).toHaveBeenCalledWith({
        chatId: 'chat-123',
        content: 'Follow up',
        userId: 'user-123',
        messageId: expect.any(String)
      });
      expect(result.chatId).toBe('chat-123');
    });

    it('should throw PERMISSION_DENIED error when user lacks permission', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(false);

      await expect(initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')).rejects.toThrow(
        ChatError
      );

      await expect(initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')).rejects.toMatchObject(
        {
          code: ChatErrorCode.PERMISSION_DENIED,
          statusCode: 403
        }
      );
    });

    it('should throw CHAT_NOT_FOUND error when chat does not exist', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(true);
      vi.mocked(getChatWithDetails).mockResolvedValue(null);

      await expect(initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')).rejects.toMatchObject(
        {
          code: ChatErrorCode.CHAT_NOT_FOUND,
          statusCode: 404
        }
      );
    });
  });

  describe('handleAssetChat', () => {
    it('should generate and add asset messages to chat', async () => {
      const assetMessages: Message[] = [
        {
          ...mockMessage,
          id: 'asset-msg-1',
          requestMessage: 'Let me help you analyze the metric "Revenue".'
        },
        {
          ...mockMessage,
          id: 'asset-msg-2',
          requestMessage: null,
          responseMessages: {
            content: 'I\'m ready to help you analyze the metric "Revenue". What would you like to know about it?',
            role: 'assistant'
          }
        }
      ];

      vi.mocked(generateAssetMessages).mockResolvedValue(assetMessages);

      const chat = buildChatWithMessages(mockChat, [], mockUser, null, false);
      const result = await handleAssetChat('chat-123', 'msg-123', 'asset-123', 'metric_file', 'user-123', chat);

      expect(generateAssetMessages).toHaveBeenCalledWith({
        assetId: 'asset-123',
        assetType: 'metric_file',
        userId: 'user-123',
        chatId: 'chat-123'
      });

      expect(result.message_ids).toContain('asset-msg-1');
      expect(result.message_ids).toContain('asset-msg-2');
    });
  });
});
