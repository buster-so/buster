import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';
import type { ChatWithMessages } from '@buster/server-shared/chats';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@trigger.dev/sdk/v3', () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

vi.mock('./services/chat-service', () => ({
  initializeChat: vi.fn(),
}));

vi.mock('./services/chat-helpers', () => ({
  handleAssetChat: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
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

import { getUserOrganizationId } from '@buster/database';
import { tasks } from '@trigger.dev/sdk/v3';
import { createChatHandler } from './handler';
import { handleAssetChat } from './services/chat-helpers';
import { initializeChat } from './services/chat-service';

describe('createChatHandler', () => {
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockChat: ChatWithMessages = {
    id: 'chat-123',
    title: 'Test Chat',
    is_favorited: false,
    message_ids: ['msg-123'],
    messages: {
      'msg-123': {
        id: 'msg-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        request_message: {
          request: 'Hello',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-123',
    created_by_id: 'user-123',
    created_by_name: 'Test User',
    created_by_avatar: null,
    publicly_accessible: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initializeChat).mockResolvedValue({
      chatId: 'chat-123',
      messageId: 'msg-123',
      chat: mockChat,
    });
    vi.mocked(getUserOrganizationId).mockResolvedValue({
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'admin',
    });
    vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-handle-123' } as any);
  });

  it('should create a new chat with prompt', async () => {
    const result = await createChatHandler({ prompt: 'Hello' }, mockUser);

    expect(initializeChat).toHaveBeenCalledWith(
      { prompt: 'Hello' },
      mockUser,
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(tasks.trigger).toHaveBeenCalledWith('analyst-agent-task', {
      message_id: 'msg-123',
    });
    expect(result).toEqual(mockChat);
  });

  it('should handle asset-based chat creation', async () => {
    const assetChat = { ...mockChat, title: 'Asset Chat' };
    vi.mocked(handleAssetChat).mockResolvedValue(assetChat);

    const result = await createChatHandler(
      { asset_id: 'asset-123', asset_type: 'metric_file' },
      mockUser
    );

    expect(handleAssetChat).toHaveBeenCalledWith(
      'chat-123',
      'msg-123',
      'asset-123',
      'metric_file',
      mockUser,
      mockChat
    );
    expect(tasks.trigger).toHaveBeenCalledWith('analyst-agent-task', {
      message_id: 'msg-123',
    });
    expect(result).toEqual(assetChat);
  });

  it('should not trigger analyst task when no content', async () => {
    const result = await createChatHandler({}, mockUser).catch((e) => {
      expect(tasks.trigger).not.toHaveBeenCalled();
      expect(e).toBeInstanceOf(ChatError);
    });

    expect(tasks.trigger).not.toHaveBeenCalled();
  });

  it('should not call handleAssetChat when prompt is provided with asset', async () => {
    const result = await createChatHandler(
      { prompt: 'Hello', asset_id: 'asset-123', asset_type: 'metric_file' },
      mockUser
    );

    expect(handleAssetChat).not.toHaveBeenCalled();
    expect(tasks.trigger).toHaveBeenCalledWith('analyst-agent-task', {
      message_id: 'msg-123',
    });
    expect(result).toEqual(mockChat);
  });

  it('should handle trigger errors gracefully', async () => {
    vi.mocked(tasks.trigger).mockReset().mockRejectedValue(new Error('Trigger failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(createChatHandler({ prompt: 'Hello' }, mockUser)).rejects.toMatchObject({
      code: ChatErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred while creating the chat',
      details: { originalError: 'Trigger failed' },
    });

    expect(consoleSpy).toHaveBeenCalledWith('Chat creation failed:', expect.any(Object));

    consoleSpy.mockRestore();
  });

  it('should throw MISSING_ORGANIZATION error when user has no org', async () => {
    const userWithoutOrg = {
      ...mockUser,
      user_metadata: {},
    };
    vi.mocked(getUserOrganizationId).mockResolvedValue(null);

    await expect(createChatHandler({ prompt: 'Hello' }, userWithoutOrg)).rejects.toMatchObject({
      code: ChatErrorCode.MISSING_ORGANIZATION,
      message: 'User is not associated with an organization',
    });
  });

  it('should re-throw ChatError instances', async () => {
    const chatError = new ChatError(ChatErrorCode.PERMISSION_DENIED, 'No permission', 403);
    vi.mocked(initializeChat).mockRejectedValue(chatError);

    await expect(createChatHandler({ prompt: 'Hello' }, mockUser)).rejects.toMatchObject({
      code: ChatErrorCode.PERMISSION_DENIED,
      message: 'No permission',
      details: undefined,
    });
  });

  it('should wrap unexpected errors', async () => {
    vi.mocked(initializeChat).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(createChatHandler({ prompt: 'Hello' }, mockUser)).rejects.toMatchObject({
      code: ChatErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred while creating the chat',
      details: { originalError: 'Database error' },
    });

    consoleSpy.mockRestore();
  });
});
