import type { Chat, Message, User } from '@buster/database/queries';
import type { ChatAssetType, ChatWithMessages } from '@buster/server-shared/chats';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@buster/database/connection', () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  },
}));

vi.mock('@buster/database/queries', () => ({
  generateAssetMessages: vi.fn(),
  createMessage: vi.fn(),
  getChatWithDetails: vi.fn(),
  getMessagesForChat: vi.fn(),
  createAssetPermission: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock('@buster/database/schema', () => ({
  chats: {},
  messages: {},
  messagesToFiles: {},
  dashboardFiles: {},
  metricFiles: {},
  assetTypeEnum: {
    enumValues: ['chat', 'metric_file', 'dashboard_file', 'report_file', 'collection'],
  },
}));

vi.mock('@buster/access-controls', () => ({
  canUserAccessChatCached: vi.fn(),
}));

import { db } from '@buster/database/connection';
import { createMessage, generateAssetMessages } from '@buster/database/queries';
import { handleAssetChat, handleAssetChatWithPrompt } from './chat-helpers';

describe('chat-helpers', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phoneNumber: null,
    isBusterAdmin: false,
    isEmailVerified: true,
    authUserId: 'auth-123',
    deletedAt: null,
  } as User;

  const createMockChat = (): ChatWithMessages => ({
    id: 'chat-123',
    title: 'Test Chat',
    is_favorited: false,
    message_ids: [],
    messages: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-123',
    created_by_id: 'user-123',
    created_by_name: 'Test User',
    created_by_avatar: null,
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    permission: 'owner',
    workspace_sharing: 'full_access',
    workspace_member_count: 0,
    individual_permissions: [],
    screenshot_taken_at: null,
  });

  const mockMetricAssetMessage: Message = {
    id: 'import-msg-123',
    chatId: 'chat-123',
    createdBy: 'user-123',
    requestMessage: null, // No request message for asset imports
    responseMessages: [
      {
        type: 'text',
        id: 'text-msg-123',
        message:
          'Test Metric has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.',
        is_final_message: true,
      },
      {
        type: 'file',
        id: 'asset-123',
        file_type: 'metric_file',
        file_name: 'Test Metric',
        version_number: 1,
        filter_version_id: null,
        metadata: [
          {
            status: 'completed',
            message: 'Pulled into new chat',
            timestamp: 1234567890,
          },
        ],
      },
    ],
    reasoning: [],
    finalReasoningMessage: '',
    title: 'Test Metric',
    rawLlmMessages: [
      {
        role: 'user',
        content: `I've imported the following metric:\n\nSuccessfully imported 1 metric file.\n\nFile details:\n[...]`,
      },
    ],
    isCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    feedback: null,
    triggerRunId: null,
    postProcessingMessage: null,
  } as Message;

  const mockDashboardAssetMessage: Message = {
    ...mockMetricAssetMessage,
    id: 'import-dashboard-msg-123',
    title: 'Test Dashboard',
    responseMessages: [
      {
        type: 'text',
        id: 'text-dashboard-msg-123',
        message:
          'Test Dashboard has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.',
        is_final_message: true,
      },
      {
        type: 'file',
        id: 'dashboard-123',
        file_type: 'dashboard_file',
        file_name: 'Test Dashboard',
        version_number: 1,
        filter_version_id: null,
        metadata: [
          {
            status: 'completed',
            message: 'Pulled into new chat',
            timestamp: 1234567890,
          },
        ],
      },
    ],
    rawLlmMessages: [
      {
        role: 'user',
        content: `I've imported the following dashboard:\n\nSuccessfully imported 1 dashboard file with 2 additional context files.\n\nFile details:\n[...]`,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAssetChat', () => {
    it('should handle metric import correctly', async () => {
      vi.mocked(generateAssetMessages).mockReset().mockResolvedValue([mockMetricAssetMessage]);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await handleAssetChat(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        mockUser,
        createMockChat()
      );

      // Verify generateAssetMessages was called correctly
      expect(generateAssetMessages).toHaveBeenCalledWith({
        assetId: 'asset-123',
        assetType: 'metric_file',
        userId: 'user-123',
        chatId: 'chat-123',
      });

      // Verify chat was updated with asset info
      expect(db.update).toHaveBeenCalledWith(expect.anything());
      const updateCall = vi.mocked(db.update).mock.calls[0];
      expect(updateCall).toBeDefined();

      // Verify message was added to chat
      expect(result.message_ids).toContain('import-msg-123');
      expect(result.messages['import-msg-123']).toBeDefined();

      const importMessage = result.messages['import-msg-123'];
      expect(importMessage?.request_message).toBeNull();
      expect(importMessage?.is_completed).toBe(true);
      expect(importMessage?.response_messages).toHaveProperty('text-msg-123');
      expect(importMessage?.response_messages).toHaveProperty('asset-123');

      // Verify response messages are in correct format
      const textMessage = importMessage?.response_messages['text-msg-123'];
      expect(textMessage).toMatchObject({
        type: 'text',
        id: 'text-msg-123',
        message: expect.stringContaining('Test Metric has been pulled into a new chat'),
        is_final_message: true,
      });

      const fileMessage = importMessage?.response_messages['asset-123'];
      expect(fileMessage).toMatchObject({
        type: 'file',
        id: 'asset-123',
        file_type: 'metric_file',
        file_name: 'Test Metric',
        version_number: 1,
      });

      // Verify chat title was updated
      expect(result.title).toBe('Test Metric');
    });

    it('should handle dashboard import with metrics correctly', async () => {
      vi.mocked(generateAssetMessages).mockReset().mockResolvedValue([mockDashboardAssetMessage]);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await handleAssetChat(
        'chat-123',
        'msg-123',
        'dashboard-123',
        'dashboard_file',
        mockUser,
        createMockChat()
      );

      // Verify generateAssetMessages was called correctly
      expect(generateAssetMessages).toHaveBeenCalledWith({
        assetId: 'dashboard-123',
        assetType: 'dashboard_file',
        userId: 'user-123',
        chatId: 'chat-123',
      });

      // Verify message was added to chat
      expect(result.message_ids).toContain('import-dashboard-msg-123');
      expect(result.messages['import-dashboard-msg-123']).toBeDefined();

      const importMessage = result.messages['import-dashboard-msg-123'];
      expect(importMessage?.response_messages).toHaveProperty('dashboard-123');

      // Verify dashboard file message
      const fileMessage = importMessage?.response_messages['dashboard-123'];
      expect(fileMessage).toMatchObject({
        type: 'file',
        id: 'dashboard-123',
        file_type: 'dashboard_file',
        file_name: 'Test Dashboard',
        version_number: 1,
      });

      // Verify chat title was updated
      expect(result.title).toBe('Test Dashboard');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(generateAssetMessages).mockReset().mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await handleAssetChat(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        mockUser,
        createMockChat()
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to handle asset chat:',
        expect.objectContaining({
          chatId: 'chat-123',
          assetId: 'asset-123',
          assetType: 'metric_file',
          userId: 'user-123',
        })
      );

      // Should return original chat without modifications
      // Note: We can't do exact comparison due to timestamp differences
      expect(result.id).toBe('chat-123');
      expect(result.title).toBe('Test Chat');
      expect(result.message_ids).toEqual([]);
      expect(result.messages).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe('handleAssetChatWithPrompt', () => {
    const mockUserMessage: Message = {
      id: 'user-msg-123',
      chatId: 'chat-123',
      createdBy: 'user-123',
      requestMessage: 'Tell me about this metric',
      responseMessages: {},
      reasoning: {},
      finalReasoningMessage: null,
      title: 'Tell me about this metric',
      rawLlmMessages: {},
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      feedback: null,
      triggerRunId: null,
      postProcessingMessage: null,
    } as Message;

    it('should create import message then user prompt message', async () => {
      // Only return the metric message for this test
      const metricOnlyMessage = { ...mockMetricAssetMessage };
      vi.mocked(generateAssetMessages).mockReset().mockResolvedValueOnce([metricOnlyMessage]);
      vi.mocked(createMessage).mockResolvedValue(mockUserMessage);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await handleAssetChatWithPrompt(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        'Tell me about this metric',
        'auto',
        mockUser,
        createMockChat()
      );

      // Verify generateAssetMessages was called (same as handleAssetChat)
      expect(generateAssetMessages).toHaveBeenCalledWith({
        assetId: 'asset-123',
        assetType: 'metric_file',
        userId: 'user-123',
        chatId: 'chat-123',
      });

      // Verify createMessage was called for user prompt
      expect(createMessage).toHaveBeenCalledWith({
        messageId: expect.any(String),
        chatId: 'chat-123',
        content: 'Tell me about this metric',
        userId: 'user-123',
        messageAnalysisMode: 'auto',
      });

      // Verify both messages were added to chat in correct order
      expect(result.message_ids).toHaveLength(2);
      expect(result.message_ids[0]).toBe('import-msg-123');
      expect(result.message_ids[1]).toBe('user-msg-123');

      // Verify import message structure
      const importMessage = result.messages['import-msg-123'];
      expect(importMessage?.request_message).toBeNull();
      expect(importMessage?.is_completed).toBe(true);
      expect(importMessage?.response_messages).toHaveProperty('asset-123');

      // Verify user message structure
      const userMessage = result.messages['user-msg-123'];
      expect(userMessage?.request_message).toMatchObject({
        request: 'Tell me about this metric',
        sender_id: 'user-123',
        sender_name: 'Test User',
      });
      expect(userMessage?.is_completed).toBe(false);
      expect(userMessage?.response_messages).toEqual({});

      // Verify chat title was updated to asset name
      expect(result.title).toBe('Test Metric');
    });

    it('should handle dashboard with prompt correctly', async () => {
      // Only return the dashboard message for this test
      vi.mocked(generateAssetMessages)
        .mockReset()
        .mockResolvedValueOnce([mockDashboardAssetMessage]);
      vi.mocked(createMessage).mockResolvedValue({
        ...mockUserMessage,
        requestMessage: 'Explain this dashboard',
      } as Message);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await handleAssetChatWithPrompt(
        'chat-123',
        'msg-123',
        'dashboard-123',
        'dashboard_file',
        'Explain this dashboard',
        'auto',
        mockUser,
        createMockChat()
      );

      // Verify generateAssetMessages was called for dashboard
      expect(generateAssetMessages).toHaveBeenCalledWith({
        assetId: 'dashboard-123',
        assetType: 'dashboard_file',
        userId: 'user-123',
        chatId: 'chat-123',
      });

      // Verify both messages exist
      expect(result.message_ids).toHaveLength(2);
      expect(result.messages['import-dashboard-msg-123']).toBeDefined();
      expect(result.messages['user-msg-123']).toBeDefined();

      // Verify chat title is dashboard name
      expect(result.title).toBe('Test Dashboard');
    });

    it('should handle missing asset gracefully', async () => {
      vi.mocked(generateAssetMessages).mockReset().mockResolvedValueOnce([]);
      vi.mocked(createMessage).mockResolvedValue(mockUserMessage);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await handleAssetChatWithPrompt(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        'Tell me about this metric',
        'auto',
        mockUser,
        createMockChat()
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'No asset messages generated',
        expect.objectContaining({
          assetId: 'asset-123',
          assetType: 'metric_file',
          userId: 'user-123',
          chatId: 'chat-123',
        })
      );

      // Should still create user message
      expect(createMessage).toHaveBeenCalled();
      expect(result.message_ids).toContain('user-msg-123');

      consoleSpy.mockRestore();
    });

    it('should handle errors and still create user message', async () => {
      vi.mocked(generateAssetMessages)
        .mockReset()
        .mockRejectedValueOnce(new Error('Database error'));
      vi.mocked(createMessage).mockResolvedValue(mockUserMessage);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await handleAssetChatWithPrompt(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        'Tell me about this metric',
        'auto',
        mockUser,
        createMockChat()
      );

      expect(consoleSpy).toHaveBeenCalled();

      // Should still create user message despite error
      expect(createMessage).toHaveBeenCalled();
      expect(result.message_ids).toContain('user-msg-123');
      expect(result.messages['user-msg-123']?.request_message?.request).toBe(
        'Tell me about this metric'
      );

      consoleSpy.mockRestore();
    });

    it('should maintain message order when multiple messages exist', async () => {
      const chatWithExistingMessages = {
        ...createMockChat(),
        message_ids: ['existing-msg-1', 'existing-msg-2'],
        messages: {
          'existing-msg-1': {} as any,
          'existing-msg-2': {} as any,
        },
      };

      vi.mocked(generateAssetMessages).mockReset().mockResolvedValueOnce([mockMetricAssetMessage]);
      vi.mocked(createMessage).mockResolvedValue(mockUserMessage);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await handleAssetChatWithPrompt(
        'chat-123',
        'msg-123',
        'asset-123',
        'metric_file',
        'Tell me about this metric',
        'auto',
        mockUser,
        chatWithExistingMessages
      );

      // Should preserve existing messages and add new ones in order
      expect(result.message_ids).toEqual([
        'existing-msg-1',
        'existing-msg-2',
        'import-msg-123',
        'user-msg-123',
      ]);
    });
  });
});
