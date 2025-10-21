import type { ModelMessage } from '@buster/ai';
import type { BusterSDK } from '@buster/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ApiConversation,
  listConversationsFromApi,
  loadConversationFromApi,
} from './api-conversation';

// Mock SDK
const createMockSdk = (): BusterSDK => ({
  config: {
    apiKey: 'test-key',
    apiUrl: 'https://api.test.com',
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
  },
  auth: {
    isApiKeyValid: vi.fn(),
  },
  deploy: vi.fn(),
  chats: {
    list: vi.fn(),
  },
  messages: {
    create: vi.fn(),
    update: vi.fn(),
    getRawMessages: vi.fn(),
  },
});

describe('loadConversationFromApi', () => {
  let mockSdk: BusterSDK;

  beforeEach(() => {
    mockSdk = createMockSdk();
    vi.clearAllMocks();
  });

  it('should load conversation from API successfully', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    vi.mocked(mockSdk.messages.getRawMessages).mockResolvedValue({
      success: true,
      chatId: 'test-chat-id',
      rawLlmMessages: mockMessages,
    });

    const result = await loadConversationFromApi('test-chat-id', mockSdk);

    expect(mockSdk.messages.getRawMessages).toHaveBeenCalledWith('test-chat-id');
    expect(result).toEqual({
      chatId: 'test-chat-id',
      modelMessages: mockMessages,
    });
  });

  it('should return null when conversation not found (404)', async () => {
    vi.mocked(mockSdk.messages.getRawMessages).mockRejectedValue(new Error('Chat not found'));

    const result = await loadConversationFromApi('missing-id', mockSdk);

    expect(result).toBeNull();
  });

  it('should return null when API returns unsuccessful response', async () => {
    vi.mocked(mockSdk.messages.getRawMessages).mockResolvedValue({
      success: false,
      chatId: 'test-id',
      rawLlmMessages: [],
    });

    const result = await loadConversationFromApi('test-id', mockSdk);

    expect(result).toBeNull();
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(mockSdk.messages.getRawMessages).mockRejectedValue(
      new Error('Network error: timeout')
    );

    const result = await loadConversationFromApi('test-id', mockSdk);

    expect(result).toBeNull();
  });

  it('should handle empty message array', async () => {
    vi.mocked(mockSdk.messages.getRawMessages).mockResolvedValue({
      success: true,
      chatId: 'empty-chat',
      rawLlmMessages: [],
    });

    const result = await loadConversationFromApi('empty-chat', mockSdk);

    expect(result).toEqual({
      chatId: 'empty-chat',
      modelMessages: [],
    });
  });

  it('should preserve message order', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Second' },
      { role: 'user', content: 'Third' },
    ];

    vi.mocked(mockSdk.messages.getRawMessages).mockResolvedValue({
      success: true,
      chatId: 'ordered-chat',
      rawLlmMessages: mockMessages,
    });

    const result = await loadConversationFromApi('ordered-chat', mockSdk);

    expect(result?.modelMessages).toEqual(mockMessages);
  });
});

describe('listConversationsFromApi', () => {
  let mockSdk: BusterSDK;

  beforeEach(() => {
    mockSdk = createMockSdk();
    vi.clearAllMocks();
  });

  it('should fetch and transform chat list from API', async () => {
    vi.mocked(mockSdk.chats.list).mockResolvedValue({
      data: [
        {
          id: 'chat-1',
          name: 'First Chat',
          updated_at: '2025-01-20T10:00:00Z',
          created_at: '2025-01-20T09:00:00Z',
        } as any,
        {
          id: 'chat-2',
          name: 'Second Chat',
          updated_at: '2025-01-20T11:00:00Z',
          created_at: '2025-01-20T10:30:00Z',
        } as any,
      ],
      pagination: {
        page: 0,
        page_size: 50,
        total: 2,
        total_pages: 1,
      },
    });

    const result = await listConversationsFromApi(mockSdk);

    expect(mockSdk.chats.list).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      chatId: 'chat-1',
      name: 'First Chat',
      updatedAt: '2025-01-20T10:00:00Z',
      createdAt: '2025-01-20T09:00:00Z',
    });
  });

  it('should handle empty chat list', async () => {
    vi.mocked(mockSdk.chats.list).mockResolvedValue({
      data: [],
      pagination: {
        page: 0,
        page_size: 50,
        total: 0,
        total_pages: 0,
      },
    });

    const result = await listConversationsFromApi(mockSdk);

    expect(result).toEqual([]);
  });

  it('should handle API errors by returning empty array', async () => {
    vi.mocked(mockSdk.chats.list).mockRejectedValue(new Error('API error'));

    const result = await listConversationsFromApi(mockSdk);

    expect(result).toEqual([]);
  });

  it('should pass pagination params to SDK', async () => {
    vi.mocked(mockSdk.chats.list).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        page_size: 25,
        total: 0,
        total_pages: 0,
      },
    });

    await listConversationsFromApi(mockSdk, { page_token: 1, page_size: 25 });

    expect(mockSdk.chats.list).toHaveBeenCalledWith({
      page_token: 1,
      page_size: 25,
      chat_type: 'data_engineer',
    });
  });

  it('should handle chats with names', async () => {
    vi.mocked(mockSdk.chats.list).mockResolvedValue({
      data: [
        {
          id: 'chat-1',
          name: 'Test Chat',
          updated_at: '2025-01-20T10:00:00Z',
          created_at: '2025-01-20T09:00:00Z',
        } as any,
      ],
      pagination: {
        page: 0,
        page_size: 50,
        total: 1,
        total_pages: 1,
      },
    });

    const result = await listConversationsFromApi(mockSdk);

    expect(result[0]?.name).toBe('Test Chat');
  });

  it('should preserve sort order from API', async () => {
    vi.mocked(mockSdk.chats.list).mockResolvedValue({
      data: [
        {
          id: 'chat-3',
          name: 'Third',
          updated_at: '2025-01-20T12:00:00Z',
          created_at: '2025-01-20T09:00:00Z',
        } as any,
        {
          id: 'chat-1',
          name: 'First',
          updated_at: '2025-01-20T10:00:00Z',
          created_at: '2025-01-20T09:00:00Z',
        } as any,
      ],
      pagination: {
        page: 0,
        page_size: 50,
        total: 2,
        total_pages: 1,
      },
    });

    const result = await listConversationsFromApi(mockSdk);

    expect(result[0]?.chatId).toBe('chat-3');
    expect(result[1]?.chatId).toBe('chat-1');
  });
});

describe('ApiConversation type', () => {
  it('should have correct structure', () => {
    const conversation: ApiConversation = {
      chatId: 'test-id',
      modelMessages: [{ role: 'user', content: 'test' }],
    };

    expect(conversation.chatId).toBe('test-id');
    expect(conversation.modelMessages).toHaveLength(1);
  });
});
