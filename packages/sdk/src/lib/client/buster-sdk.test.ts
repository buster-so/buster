import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as httpModule from '../http';
import { createBusterSDK } from './buster-sdk';

// Mock the http module
vi.mock('../http', () => ({
  put: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

describe('BusterSDK - messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('messages.update', () => {
    it('should call PUT with correct path and body for rawLlmMessages update', async () => {
      const mockPut = vi.mocked(httpModule.put);
      mockPut.mockResolvedValue({
        success: true,
        messageId: 'message-123',
      });

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const chatId = 'chat-123';
      const messageId = 'message-123';
      const rawLlmMessages = [
        { role: 'user', content: 'test message' },
        { role: 'assistant', content: 'test response' },
      ];

      await sdk.messages.update(chatId, messageId, { rawLlmMessages });

      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          apiUrl: 'https://api.test.com',
        }),
        '/public/chats/chat-123/messages/message-123',
        { rawLlmMessages }
      );
    });

    it('should call PUT with correct path and body for isCompleted update', async () => {
      const mockPut = vi.mocked(httpModule.put);
      mockPut.mockResolvedValue({
        success: true,
        messageId: 'message-456',
      });

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const chatId = 'chat-456';
      const messageId = 'message-456';

      await sdk.messages.update(chatId, messageId, { isCompleted: true });

      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          apiUrl: 'https://api.test.com',
        }),
        '/public/chats/chat-456/messages/message-456',
        { isCompleted: true }
      );
    });

    it('should call PUT with both rawLlmMessages and isCompleted', async () => {
      const mockPut = vi.mocked(httpModule.put);
      mockPut.mockResolvedValue({
        success: true,
        messageId: 'message-789',
      });

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const chatId = 'chat-789';
      const messageId = 'message-789';
      const rawLlmMessages = [{ role: 'user', content: 'test' }];

      await sdk.messages.update(chatId, messageId, {
        rawLlmMessages,
        isCompleted: true,
      });

      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          apiUrl: 'https://api.test.com',
        }),
        '/public/chats/chat-789/messages/message-789',
        {
          rawLlmMessages,
          isCompleted: true,
        }
      );
    });

    it('should return the response from the API', async () => {
      const mockPut = vi.mocked(httpModule.put);
      const expectedResponse = {
        success: true,
        messageId: 'message-abc',
      };
      mockPut.mockResolvedValue(expectedResponse);

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const result = await sdk.messages.update('chat-abc', 'message-abc', {
        isCompleted: true,
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the HTTP client', async () => {
      const mockPut = vi.mocked(httpModule.put);
      const error = new Error('Network error');
      mockPut.mockRejectedValue(error);

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      await expect(
        sdk.messages.update('chat-123', 'message-123', { isCompleted: true })
      ).rejects.toThrow('Network error');
    });

    it('should work with different API URLs', async () => {
      const mockPut = vi.mocked(httpModule.put);
      mockPut.mockResolvedValue({
        success: true,
        messageId: 'message-test',
      });

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://staging.api.test.com',
      });

      await sdk.messages.update('chat-test', 'message-test', { isCompleted: false });

      expect(mockPut).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://staging.api.test.com',
        }),
        '/public/chats/chat-test/messages/message-test',
        { isCompleted: false }
      );
    });

    it('should construct correct nested endpoint path', async () => {
      const mockPut = vi.mocked(httpModule.put);
      mockPut.mockResolvedValue({
        success: true,
        messageId: 'msg-id',
      });

      const sdk = createBusterSDK({
        apiKey: 'key',
        apiUrl: 'https://api.test.com',
      });

      await sdk.messages.update('chat-id', 'msg-id', { isCompleted: true });

      // Verify it uses the nested endpoint structure
      expect(mockPut).toHaveBeenCalledWith(
        expect.anything(),
        '/public/chats/chat-id/messages/msg-id',
        expect.anything()
      );
    });
  });
});

describe('BusterSDK - chats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chats.list', () => {
    it('should fetch paginated chat list from API with default params', async () => {
      const mockGet = vi.mocked(httpModule.get);
      const mockResponse = {
        data: [
          {
            id: 'chat-1',
            name: 'Test Chat 1',
            updated_at: '2025-01-20T10:00:00Z',
            created_at: '2025-01-20T09:00:00Z',
          } as any,
          {
            id: 'chat-2',
            name: 'Test Chat 2',
            updated_at: '2025-01-20T11:00:00Z',
            created_at: '2025-01-20T10:00:00Z',
          } as any,
        ],
        pagination: {
          page: 0,
          page_size: 50,
          total: 2,
          total_pages: 1,
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const result = await sdk.chats.list();

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          apiUrl: 'https://api.test.com',
        }),
        '/public/chats',
        undefined
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass pagination params to API', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockResolvedValue({
        data: [],
        pagination: {
          page: 2,
          page_size: 25,
          total: 0,
          total_pages: 0,
        },
      });

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      await sdk.chats.list({ page_token: 2, page_size: 25 });

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          apiUrl: 'https://api.test.com',
        }),
        '/public/chats',
        { page_token: '2', page_size: '25' }
      );
    });

    it('should handle empty chat list', async () => {
      const mockGet = vi.mocked(httpModule.get);
      const emptyResponse = {
        data: [],
        pagination: {
          page: 0,
          page_size: 50,
          total: 0,
          total_pages: 0,
        },
      };
      mockGet.mockResolvedValue(emptyResponse);

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      const result = await sdk.chats.list();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockRejectedValue(new Error('Network error'));

      const sdk = createBusterSDK({
        apiKey: 'test-api-key',
        apiUrl: 'https://api.test.com',
      });

      await expect(sdk.chats.list()).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized errors', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockRejectedValue(new Error('Unauthorized'));

      const sdk = createBusterSDK({
        apiKey: 'invalid-key',
        apiUrl: 'https://api.test.com',
      });

      await expect(sdk.chats.list()).rejects.toThrow('Unauthorized');
    });

    it('should construct correct endpoint path', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockResolvedValue({
        data: [],
        pagination: {
          page: 0,
          page_size: 50,
          total: 0,
          total_pages: 0,
        },
      });

      const sdk = createBusterSDK({
        apiKey: 'key',
        apiUrl: 'https://api.test.com',
      });

      await sdk.chats.list();

      expect(mockGet).toHaveBeenCalledWith(expect.anything(), '/public/chats', undefined);
    });

    it('should work with different API URLs', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockResolvedValue({
        data: [],
        pagination: {
          page: 0,
          page_size: 50,
          total: 0,
          total_pages: 0,
        },
      });

      const sdk = createBusterSDK({
        apiKey: 'test-key',
        apiUrl: 'https://staging.api.test.com',
      });

      await sdk.chats.list();

      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://staging.api.test.com',
        }),
        '/public/chats',
        undefined
      );
    });

    it('should return paginated response with multiple pages', async () => {
      const mockGet = vi.mocked(httpModule.get);
      mockGet.mockResolvedValue({
        data: Array(50).fill({ id: 'chat-x', name: 'Chat' } as any),
        pagination: {
          page: 0,
          page_size: 50,
          total: 100,
          total_pages: 2,
        },
      });

      const sdk = createBusterSDK({
        apiKey: 'test-key',
        apiUrl: 'https://api.test.com',
      });

      const result = await sdk.chats.list();

      expect(result.pagination.total_pages).toBe(2);
      expect(result.pagination.total).toBe(100);
    });
  });
});
