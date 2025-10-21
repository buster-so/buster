import { render } from 'ink-testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation } from '../../utils/conversation-history';
import { HistoryBrowser } from './history-browser';

// Mock API conversation utilities
vi.mock('../../utils/api-conversation', () => ({
  listConversationsFromApi: vi.fn(),
  loadConversationFromApi: vi.fn(),
}));

// Mock SDK factory
vi.mock('../../utils/sdk-factory', () => ({
  getOrCreateSdk: vi.fn(),
}));

describe('HistoryBrowser', () => {
  const mockWorkingDirectory = '/Users/test/project';
  const mockOnSelect = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading message while fetching conversations', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock API call that never resolves to keep loading state
      vi.mocked(listConversationsFromApi).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Should show loading state
      expect(lastFrame()).toContain('Resume Session');
      expect(lastFrame()).toContain('Loading conversations from API');
    });
  });

  describe('error handling', () => {
    it('should show error when SDK creation fails', async () => {
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK creation failure
      vi.mocked(getOrCreateSdk).mockRejectedValue(new Error('No credentials'));

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for error state
      await vi.waitFor(() => {
        expect(lastFrame()).toContain('Unable to connect to API');
      });

      expect(lastFrame()).toContain('Resume Session');
      expect(lastFrame()).toContain('Please check your credentials');
      expect(lastFrame()).toContain('Esc to go back');
    });

    it('should show error when API call fails', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock API failure
      vi.mocked(listConversationsFromApi).mockRejectedValue(new Error('API request failed'));

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for error state
      await vi.waitFor(() => {
        expect(lastFrame()).toContain('Failed to load conversations from API');
      });

      expect(lastFrame()).toContain('Resume Session');
      expect(lastFrame()).toContain('Esc to go back');
    });

    it('should use provided SDK instead of creating new one', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(listConversationsFromApi).mockResolvedValue([]);

      render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
          sdk={mockSdk as any}
        />
      );

      // Wait for API call
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalledWith(mockSdk);
      });

      // Should NOT call getOrCreateSdk when SDK is provided
      expect(getOrCreateSdk).not.toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('should show message when no conversations found', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock empty conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([]);

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for empty state
      await vi.waitFor(() => {
        expect(lastFrame()).toContain('No previous conversations found in API');
      });

      expect(lastFrame()).toContain('Resume Session');
      expect(lastFrame()).toContain('Esc to go back');
    });
  });

  describe('conversation list display', () => {
    it('should display list of conversations from API', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'First conversation',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
        {
          chatId: 'chat-2',
          name: 'Second conversation',
          createdAt: '2024-01-02T10:00:00Z',
          updatedAt: '2024-01-02T11:00:00Z',
        },
      ]);

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(lastFrame()).toContain('First conversation');
      });

      expect(lastFrame()).toContain('Resume Session');
      expect(lastFrame()).toContain('First conversation');
      expect(lastFrame()).toContain('Second conversation');
      expect(lastFrame()).toContain('↑↓ to navigate');
      expect(lastFrame()).toContain('Enter to resume');
      expect(lastFrame()).toContain('Esc to cancel');
    });

    it('should truncate long conversation names', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation with very long name
      const longName = 'A'.repeat(100);
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: longName,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        const frame = lastFrame();
        expect(frame).toContain('...');
      });

      // Should not contain the full long name
      expect(lastFrame()).not.toContain(longName);
    });

    it('should show "Untitled conversation" when name is missing', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation without name
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: '',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(lastFrame()).toContain('Untitled conversation');
      });
    });

    it('should display relative time for conversations', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation updated 1 minute ago
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Recent chat',
          createdAt: oneMinuteAgo,
          updatedAt: oneMinuteAgo,
        },
      ]);

      const { lastFrame } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        const frame = lastFrame();
        // Should show relative time (e.g., "1 minute ago")
        expect(frame).toMatch(/\d+ (second|minute|hour|day)s? ago/);
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should call onCancel when Escape is pressed', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Test conversation',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      const { stdin } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalled();
      });

      // Simulate Escape key press
      stdin.write('\x1B'); // ESC

      // Should call onCancel
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('conversation selection', () => {
    it('should load and return full conversation when Enter is pressed', async () => {
      const { listConversationsFromApi, loadConversationFromApi } = await import(
        '../../utils/api-conversation'
      );
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = {
        chats: { list: vi.fn() },
        messages: { getRawMessages: vi.fn() },
      };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Test conversation',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      // Mock full conversation load
      const mockModelMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      vi.mocked(loadConversationFromApi).mockResolvedValue({
        chatId: 'chat-1',
        modelMessages: mockModelMessages as any,
      });

      const { stdin } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalled();
      });

      // Simulate Enter key press
      stdin.write('\r');

      // Wait for conversation to load and onSelect to be called
      await vi.waitFor(() => {
        expect(loadConversationFromApi).toHaveBeenCalledWith('chat-1', mockSdk);
      });

      await vi.waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalled();
      });

      // Verify the full conversation object passed to onSelect
      const selectedConversation = mockOnSelect.mock.calls[0]?.[0] as Conversation;
      expect(selectedConversation).toBeDefined();
      expect(selectedConversation.chatId).toBe('chat-1');
      expect(selectedConversation.modelMessages).toEqual(mockModelMessages);
      expect(selectedConversation.workingDirectory).toBe(mockWorkingDirectory);
      expect(selectedConversation.createdAt).toBe('2024-01-01T10:00:00Z');
      expect(selectedConversation.updatedAt).toBe('2024-01-01T11:00:00Z');
    });

    it('should handle failed conversation load gracefully', async () => {
      const { listConversationsFromApi, loadConversationFromApi } = await import(
        '../../utils/api-conversation'
      );
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = {
        chats: { list: vi.fn() },
        messages: { getRawMessages: vi.fn() },
      };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Test conversation',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      // Mock conversation load failure
      vi.mocked(loadConversationFromApi).mockRejectedValue(new Error('Load failed'));

      const { stdin } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalled();
      });

      // Simulate Enter key press
      stdin.write('\r');

      // Wait a bit for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT call onSelect when load fails
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should handle null conversation result gracefully', async () => {
      const { listConversationsFromApi, loadConversationFromApi } = await import(
        '../../utils/api-conversation'
      );
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = {
        chats: { list: vi.fn() },
        messages: { getRawMessages: vi.fn() },
      };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Test conversation',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      // Mock conversation load returning null
      vi.mocked(loadConversationFromApi).mockResolvedValue(null);

      const { stdin } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for conversations to load
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalled();
      });

      // Simulate Enter key press
      stdin.write('\r');

      // Wait a bit for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT call onSelect when conversation is null
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('API-first behavior', () => {
    it('should call listConversationsFromApi with SDK', async () => {
      const { listConversationsFromApi } = await import('../../utils/api-conversation');
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = { chats: { list: vi.fn() } };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      vi.mocked(listConversationsFromApi).mockResolvedValue([]);

      render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      // Wait for API call
      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalledWith(mockSdk);
      });
    });

    it('should enrich API response with required Conversation fields', async () => {
      const { listConversationsFromApi, loadConversationFromApi } = await import(
        '../../utils/api-conversation'
      );
      const { getOrCreateSdk } = await import('../../utils/sdk-factory');

      // Mock SDK
      const mockSdk = {
        chats: { list: vi.fn() },
        messages: { getRawMessages: vi.fn() },
      };
      vi.mocked(getOrCreateSdk).mockResolvedValue(mockSdk as any);

      // Mock conversation list
      vi.mocked(listConversationsFromApi).mockResolvedValue([
        {
          chatId: 'chat-1',
          name: 'Test',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ]);

      // Mock API response (minimal fields)
      vi.mocked(loadConversationFromApi).mockResolvedValue({
        chatId: 'chat-1',
        modelMessages: [],
      });

      const { stdin } = render(
        <HistoryBrowser
          workingDirectory={mockWorkingDirectory}
          onSelect={mockOnSelect}
          onCancel={mockOnCancel}
        />
      );

      await vi.waitFor(() => {
        expect(listConversationsFromApi).toHaveBeenCalled();
      });

      stdin.write('\r');

      await vi.waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalled();
      });

      // Verify enriched conversation has all required fields
      const conversation = mockOnSelect.mock.calls[0]?.[0] as Conversation;
      expect(conversation.chatId).toBe('chat-1');
      expect(conversation.workingDirectory).toBe(mockWorkingDirectory);
      expect(conversation.createdAt).toBe('2024-01-01T10:00:00Z');
      expect(conversation.updatedAt).toBe('2024-01-01T11:00:00Z');
      expect(conversation.modelMessages).toEqual([]);
    });
  });
});
