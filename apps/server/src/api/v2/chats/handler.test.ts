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
  handleAssetChatWithPrompt: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  getUserOrganizationId: vi.fn(),
  createChat: vi.fn(),
  getChatWithDetails: vi.fn(),
  createMessage: vi.fn(),
  generateAssetMessages: vi.fn(),
  getMessagesForChat: vi.fn(),
  updateMessage: vi.fn(),
  db: {
    transaction: vi.fn().mockImplementation((callback: any) =>
      callback({
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'chat-123' }]),
      })
    ),
  },
  chats: {},
  messages: {},
}));

import { getUserOrganizationId, updateMessage } from '@buster/database';
import { tasks } from '@trigger.dev/sdk/v3';
import { createChatHandler } from './handler';
import { handleAssetChat, handleAssetChatWithPrompt } from './services/chat-helpers';
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
      role: 'workspace_admin',
    });
    vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-handle-123' } as any);
    vi.mocked(updateMessage).mockResolvedValue({} as any);
  });

  it('should create a new chat with prompt', async () => {
    const result = await createChatHandler({ prompt: 'Hello' }, mockUser);

    expect(initializeChat).toHaveBeenCalledWith(
      { prompt: 'Hello' },
      mockUser,
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(tasks.trigger).toHaveBeenCalledWith(
      'analyst-agent-task',
      {
        message_id: 'msg-123',
      },
      {
        concurrencyKey: 'chat-123',
      }
    );
    expect(result).toEqual(mockChat);
  });

  it('should handle asset-based chat creation and NOT trigger analyst task', async () => {
    // Asset chat should match Rust implementation exactly
    const assetChat = {
      ...mockChat,
      title: 'Test Metric', // Should be the asset name
      message_ids: ['asset-msg-123'],
      messages: {
        'asset-msg-123': {
          id: 'asset-msg-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          request_message: null, // No request message per Rust implementation
          response_messages: {
            'text-msg-id': {
              type: 'text' as const,
              id: 'text-msg-id',
              message:
                'Test Metric has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.',
              is_final_message: true,
            },
            'asset-123': {
              type: 'file' as const,
              id: 'asset-123',
              file_type: 'metric' as const,
              file_name: 'Test Metric',
              version_number: 1,
              filter_version_id: null,
              metadata: [
                {
                  status: 'completed' as const,
                  message: 'Pulled into new chat',
                  timestamp: expect.any(Number),
                },
              ],
            },
          },
          response_message_ids: ['text-msg-id', 'asset-123'],
          reasoning_message_ids: [],
          reasoning_messages: {},
          final_reasoning_message: '',
          feedback: null,
          is_completed: true,
        },
      },
    };
    vi.mocked(handleAssetChat).mockResolvedValue(assetChat);

    const result = await createChatHandler(
      { asset_id: 'asset-123', asset_type: 'metric' },
      mockUser
    );

    expect(handleAssetChat).toHaveBeenCalledWith(
      'chat-123',
      'msg-123',
      'asset-123',
      'metric',
      mockUser,
      mockChat
    );
    // IMPORTANT: Should NOT trigger analyst task for asset-only requests
    expect(tasks.trigger).not.toHaveBeenCalled();
    expect(result).toEqual(assetChat);
  });

  it('should not trigger analyst task when no content', async () => {
    const result = await createChatHandler({}, mockUser).catch((e) => {
      expect(tasks.trigger).not.toHaveBeenCalled();
      expect(e).toBeInstanceOf(ChatError);
    });

    expect(tasks.trigger).not.toHaveBeenCalled();
  });

  it('should call handleAssetChatWithPrompt when prompt is provided with asset', async () => {
    // Chat should start empty when we have asset+prompt
    const emptyChat = {
      ...mockChat,
      message_ids: [],
      messages: {},
    };

    // After handleAssetChatWithPrompt, we should have import message then user message
    const chatWithPrompt = {
      ...mockChat,
      message_ids: ['import-msg-123', 'user-msg-123'],
      messages: {
        'import-msg-123': {
          id: 'import-msg-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          request_message: null,
          response_messages: {},
          response_message_ids: [],
          reasoning_message_ids: [],
          reasoning_messages: {},
          final_reasoning_message: null,
          feedback: null,
          is_completed: true,
        },
        'user-msg-123': {
          id: 'user-msg-123',
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
    };

    // Mock initializeChat to return empty chat (no initial message created)
    vi.mocked(initializeChat).mockResolvedValue({
      chatId: 'chat-123',
      messageId: 'msg-123',
      chat: emptyChat,
    });

    vi.mocked(handleAssetChatWithPrompt).mockResolvedValueOnce(chatWithPrompt);

    const result = await createChatHandler(
      { prompt: 'Hello', asset_id: 'asset-123', asset_type: 'metric' },
      mockUser
    );

    // Verify initializeChat was called without prompt (to avoid duplicate message)
    expect(initializeChat).toHaveBeenCalledWith(
      { prompt: undefined, asset_id: 'asset-123', asset_type: 'metric' },
      mockUser,
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(handleAssetChat).not.toHaveBeenCalled();
    expect(handleAssetChatWithPrompt).toHaveBeenCalledWith(
      'chat-123',
      'msg-123',
      'asset-123',
      'metric',
      'Hello',
      mockUser,
      emptyChat
    );
    expect(tasks.trigger).toHaveBeenCalledWith(
      'analyst-agent-task',
      {
        message_id: 'user-msg-123', // Should use the last message ID (user's prompt)
      },
      {
        concurrencyKey: 'chat-123',
      }
    );
    expect(result).toEqual(chatWithPrompt);
  });

  it('should ensure correct message order: import first, then user prompt', async () => {
    const chatWithMessages = {
      ...mockChat,
      message_ids: ['import-msg-123', 'user-msg-123'],
      messages: {
        'import-msg-123': {
          id: 'import-msg-123',
          created_at: '2025-07-25T12:00:00.000Z',
          updated_at: '2025-07-25T12:00:00.000Z',
          request_message: null, // Import messages have no request
          response_messages: {
            'asset-123': {
              type: 'file' as const,
              id: 'asset-123',
              file_type: 'metric' as const,
              file_name: 'Test Metric',
              version_number: 1,
            },
          },
          response_message_ids: ['asset-123'],
          reasoning_message_ids: [],
          reasoning_messages: {},
          final_reasoning_message: null,
          feedback: null,
          is_completed: true,
        },
        'user-msg-123': {
          id: 'user-msg-123',
          created_at: '2025-07-25T12:00:01.000Z', // After import
          updated_at: '2025-07-25T12:00:01.000Z',
          request_message: {
            request: 'What is this metric?',
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
    };

    vi.mocked(initializeChat).mockResolvedValue({
      chatId: 'chat-123',
      messageId: 'msg-123',
      chat: { ...mockChat, message_ids: [], messages: {} }, // Empty chat
    });

    vi.mocked(handleAssetChatWithPrompt).mockResolvedValueOnce(chatWithMessages);

    const result = await createChatHandler(
      { prompt: 'What is this metric?', asset_id: 'asset-123', asset_type: 'metric' },
      mockUser
    );

    // Verify message order is correct
    expect(result.message_ids).toHaveLength(2);
    expect(result.message_ids[0]).toBe('import-msg-123');
    expect(result.message_ids[1]).toBe('user-msg-123');

    // Verify import message has no request
    const importMsg = result.messages['import-msg-123'];
    expect(importMsg).toBeDefined();
    expect(importMsg?.request_message).toBeNull();
    expect(importMsg?.is_completed).toBe(true);

    // Verify user message has request
    const userMsg = result.messages['user-msg-123'];
    expect(userMsg).toBeDefined();
    expect(userMsg?.request_message?.request).toBe('What is this metric?');
    expect(userMsg?.is_completed).toBe(false);

    // Verify analyst task is triggered with user message ID
    expect(tasks.trigger).toHaveBeenCalledWith(
      'analyst-agent-task',
      { message_id: 'user-msg-123' },
      { concurrencyKey: 'chat-123' }
    );
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
