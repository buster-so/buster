import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { createChatHandler } from './handler';
import { ChatError, ChatErrorCode } from '../../../types/chat-errors.types';
import type { ChatWithMessages } from '../../../types/chat.types';

// Mock dependencies
vi.mock('@trigger.dev/sdk/v3', () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

vi.mock('./services/chat-service', () => ({
  initializeChat: vi.fn(),
  handleAssetChat: vi.fn(),
}));

// Import mocked functions
import { tasks } from '@trigger.dev/sdk/v3';
import { initializeChat, handleAssetChat } from './services/chat-service';

describe('createChatHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      organization_id: 'org-123',
      name: 'Test User',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  const mockChat: ChatWithMessages = {
    id: 'chat-123',
    title: 'Test Chat',
    is_favorited: false,
    message_ids: ['msg-123'],
    messages: {
      'msg-123': {
        id: 'msg-123',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        request_message: {
          request: 'Hello',
          sender_id: 'user-123',
          sender_name: 'Test User',
        },
      },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-123',
    created_by_id: 'user-123',
    created_by_name: 'Test User',
    publicly_accessible: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initializeChat).mockResolvedValue({
      chatId: 'chat-123',
      messageId: 'msg-123',
      chat: mockChat,
    });
  });

  it('should create a new chat with prompt', async () => {
    const result = await createChatHandler(
      { prompt: 'Hello' },
      mockUser
    );

    expect(initializeChat).toHaveBeenCalledWith(
      { prompt: 'Hello' },
      mockUser,
      'org-123'
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
      'user-123',
      mockChat
    );
    expect(tasks.trigger).toHaveBeenCalledWith('analyst-agent-task', {
      message_id: 'msg-123',
    });
    expect(result).toEqual(assetChat);
  });

  it('should not trigger analyst task when no content', async () => {
    const result = await createChatHandler(
      {},
      mockUser
    );

    expect(tasks.trigger).not.toHaveBeenCalled();
    expect(result).toEqual(mockChat);
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
    vi.mocked(tasks.trigger).mockRejectedValue(new Error('Trigger failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await createChatHandler(
      { prompt: 'Hello' },
      mockUser
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to trigger analyst agent task:',
      expect.any(Error)
    );
    expect(result).toEqual(mockChat); // Should still return the chat
    
    consoleSpy.mockRestore();
  });

  it('should throw MISSING_ORGANIZATION error when user has no org', async () => {
    const userWithoutOrg = {
      ...mockUser,
      user_metadata: {},
    };

    await expect(
      createChatHandler({ prompt: 'Hello' }, userWithoutOrg)
    ).rejects.toMatchObject({
      code: ChatErrorCode.MISSING_ORGANIZATION,
      statusCode: 400,
    });
  });

  it('should re-throw ChatError instances', async () => {
    const chatError = new ChatError(
      ChatErrorCode.PERMISSION_DENIED,
      'No permission',
      403
    );
    vi.mocked(initializeChat).mockRejectedValue(chatError);

    await expect(
      createChatHandler({ prompt: 'Hello' }, mockUser)
    ).rejects.toThrow(chatError);
  });

  it('should wrap unexpected errors', async () => {
    vi.mocked(initializeChat).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      createChatHandler({ prompt: 'Hello' }, mockUser)
    ).rejects.toMatchObject({
      code: ChatErrorCode.INTERNAL_ERROR,
      statusCode: 500,
      details: { originalError: 'Database error' },
    });

    consoleSpy.mockRestore();
  });
});