import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database connection and database functions BEFORE any other imports
vi.mock('@buster/database/connection', () => ({
  initializePool: vi.fn(),
  getPool: vi.fn(),
}));
vi.mock('@buster/database', () => ({
  checkChatPermission: vi.fn(),
  createMessage: vi.fn(),
  db: {
    transaction: vi.fn((callback: any) => callback({ insert: vi.fn() })),
  },
  getChatWithDetails: vi.fn(),
  getMessagesForChat: vi.fn(),
  chats: {},
  messages: {},
}));

import * as database from '@buster/database';
import type { Chat, Message } from '@buster/database';
import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';
import { buildChatWithMessages, handleExistingChat, handleNewChat } from './chat-helpers';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test User',
  email: 'test@example.com',
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

describe('buildChatWithMessages', () => {
  it('should build a ChatWithMessages object from database entities', () => {
    const result = buildChatWithMessages(mockChat, [mockMessage], mockUser, true);
    expect(result).toMatchObject({
      id: 'chat-123',
      title: 'Test Chat',
      is_favorited: true,
      message_ids: ['msg-123'],
      messages: {
        'msg-123': {
          id: 'msg-123',
          created_at: expect.any(String),
          updated_at: expect.any(String),
          request_message: {
            request: 'Test message',
            sender_id: 'user-123',
            sender_name: 'Test User',
          },
          response_messages: {},
          response_message_ids: [],
          reasoning_message_ids: [],
          reasoning_messages: {},
          final_reasoning_message: null,
          feedback: null,
          is_completed: false,
        },
      },
      created_at: expect.any(String),
      updated_at: expect.any(String),
      created_by: '550e8400-e29b-41d4-a716-446655440001',
      created_by_id: '550e8400-e29b-41d4-a716-446655440001',
      created_by_name: 'Test User',
      created_by_avatar: null,
      publicly_accessible: false,
      permission: 'owner',
    });
  });

  it('should handle missing creator details', () => {
    const result = buildChatWithMessages(mockChat, [], null, false);

    expect(result.created_by_name).toBe('Unknown User');
    expect(result.created_by_avatar).toBeNull();
  });
});

describe('handleExistingChat', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle existing chat with new message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockMessage = {
      id: 'message-1',
      chatId: 'chat-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      requestMessage: 'Test message',
      responseMessages: {},
      reasoning: {},
      title: 'Test message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: mockChat,
      user: mockUser as unknown as any,
      isFavorited: false,
    });

    vi.mocked(database.checkChatPermission).mockResolvedValue(true);
    vi.mocked(database.createMessage).mockResolvedValue(mockMessage);
    vi.mocked(database.getMessagesForChat).mockResolvedValue([mockMessage]);

    const result = await handleExistingChat('chat-1', 'message-1', 'Test message', mockUser);

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
    expect(result.chat.messages['message-1']).toBeDefined();
  });

  it('should throw error if chat not found', async () => {
    vi.mocked(database.getChatWithDetails).mockResolvedValue(null);

    await expect(
      handleExistingChat('chat-1', 'message-1', 'Test message', mockUser)
    ).rejects.toThrow(new ChatError(ChatErrorCode.CHAT_NOT_FOUND, 'Chat not found', 404));
  });

  it('should throw error if permission denied', async () => {
    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: { id: 'chat-1' } as Chat,
      user: null,
      isFavorited: false,
    });
    vi.mocked(database.checkChatPermission).mockResolvedValue(false);

    await expect(
      handleExistingChat('chat-1', 'message-1', 'Test message', mockUser)
    ).rejects.toThrow(
      new ChatError(
        ChatErrorCode.PERMISSION_DENIED,
        'You do not have permission to access this chat',
        403
      )
    );
  });
});

describe('handleNewChat', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new chat with message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockChat]),
    };

    vi.mocked(database.db.transaction).mockImplementation((callback: any) => callback(mockTx));

    const result = await handleNewChat({
      title: 'Test Chat',
      messageId: 'message-1',
      prompt: 'Test message',
      user: mockUser,
      organizationId: 'org-1',
    });

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
  });

  it('should create new chat without message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockChat]),
    };

    vi.mocked(database.db.transaction).mockImplementation((callback: any) => callback(mockTx));

    const result = await handleNewChat({
      title: 'Test Chat',
      messageId: 'message-1',
      prompt: undefined,
      user: mockUser,
      organizationId: 'org-1',
    });

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
    expect(Object.keys(result.chat.messages)).toHaveLength(0);
  });
});
