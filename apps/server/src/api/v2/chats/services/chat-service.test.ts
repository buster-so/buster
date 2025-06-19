import type { Chat, Message } from '@buster/database/src/helpers/chats';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatError, ChatErrorCode } from '../../../../types/chat-types';
import { initializeChat } from './chat-service';

// Import mocked functions
import {
  checkChatPermission,
  createChat,
  createMessage,
  generateAssetMessages,
  getChatWithDetails,
  getMessagesForChat,
} from '@buster/database';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
};

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
  mostRecentVersionNumber: null,
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
  feedback: null,
};

// Mock database functions
vi.mock('@buster/database', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      return callback({
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockChat]),
      });
    }),
  },
  chats: {},
  messages: {},
  createChat: vi.fn(),
  getChatWithDetails: vi.fn(),
  createMessage: vi.fn(),
  checkChatPermission: vi.fn(),
  generateAssetMessages: vi.fn(),
  getMessagesForChat: vi.fn(),
}));

describe('chat-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeChat', () => {
    it('should create a new chat when chat_id is not provided', async () => {
      const result = await initializeChat(
        { prompt: 'Hello' },
        mockUser,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result.chatId).toBe('chat-123');
      expect(result.chat.title).toBe('Test Chat');
    });

    it('should add message to existing chat when chat_id is provided', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(true);
      vi.mocked(getChatWithDetails).mockResolvedValue({
        chat: mockChat,
        user: { id: 'user-123', name: 'Test User', avatarUrl: null } as any,
        isFavorited: false,
      });
      vi.mocked(getMessagesForChat).mockResolvedValue([mockMessage]);
      vi.mocked(createMessage).mockResolvedValue({
        ...mockMessage,
        id: 'msg-456',
        requestMessage: 'Follow up',
      });

      const result = await initializeChat(
        { chat_id: 'chat-123', prompt: 'Follow up' },
        mockUser,
        'org-123'
      );

      expect(checkChatPermission).toHaveBeenCalledWith('chat-123', mockUser.id);
      expect(createMessage).toHaveBeenCalledWith({
        chatId: 'chat-123',
        content: 'Follow up',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        messageId: expect.any(String),
      });
      expect(result.chatId).toBe('chat-123');
    });

    it('should throw PERMISSION_DENIED error when user lacks permission', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(false);

      await expect(
        initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')
      ).rejects.toThrow(ChatError);

      await expect(
        initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')
      ).rejects.toMatchObject({
        code: ChatErrorCode.PERMISSION_DENIED,
        statusCode: 403,
      });
    });

    it('should throw CHAT_NOT_FOUND error when chat does not exist', async () => {
      vi.mocked(checkChatPermission).mockResolvedValue(true);
      vi.mocked(getChatWithDetails).mockResolvedValue(null);

      await expect(
        initializeChat({ chat_id: 'chat-123', prompt: 'Hello' }, mockUser, 'org-123')
      ).rejects.toMatchObject({
        code: ChatErrorCode.CHAT_NOT_FOUND,
        statusCode: 404,
      });
    });
  });
});
