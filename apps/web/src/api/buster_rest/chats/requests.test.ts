import type { ChatListItem } from '@buster/server-shared/chats';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mainApiV2 } from '../instances';

// Mock the mainApi and mainApiV2
vi.mock('../instances', () => ({
  mainApi: {
    get: vi.fn(),
  },
  mainApiV2: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Chat API Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getListChats', () => {
    it('should fetch list of chats with default pagination parameters', async () => {
      // Mock data
      const mockChats: ChatListItem[] = [
        {
          id: 'test-chat-1',
          name: 'Test Chat 1',
          created_at: '2024-03-20T00:00:00Z',
          updated_at: '2024-03-20T00:00:00Z',
          created_by: 'test-user',
          created_by_id: 'test-user-id',
          created_by_name: 'Test User',
          created_by_avatar: 'avatar-url',
          last_edited: '2024-03-20T00:00:00Z',
          latest_file_id: 'file-1',
          latest_file_type: 'dashboard_file',
          latest_version_number: 1,
          is_shared: false,
        },
      ];

      // Setup mock response
      (mainApiV2.get as any).mockResolvedValueOnce({
        data: { data: mockChats },
      });

      // Import the function we want to test
      const { getListChats } = await import('./requestsV2');

      // Execute the function
      const result = await getListChats();

      // Verify the API was called with correct parameters
      expect(mainApiV2.get).toHaveBeenCalledWith('/chats', {
        params: { page: 1, page_size: 3500 },
      });

      // Verify the result matches the mock data
      expect(result).toEqual(mockChats);
    });
  });
});
