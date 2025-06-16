import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInitializeChat } from './useInitializeChat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useChatUpdate } from './useChatUpdate';
import { BusterRoutes } from '@/routes';
import { updateChatToIChat } from '@/lib/chat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BusterChat } from '@/api/asset_interfaces/chat';
import { MOCK_CHAT } from '@/mocks/MOCK_CHAT';

// Mock dependencies
vi.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: vi.fn()
}));

vi.mock('./useChatUpdate', () => ({
  useChatUpdate: vi.fn()
}));

vi.mock('@/lib/chat', () => ({
  updateChatToIChat: vi.fn()
}));

// Create a wrapper component for the hook
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useInitializeChat', () => {
  const mockOnChangePage = vi.fn();
  const mockOnUpdateChat = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    (useAppLayoutContextSelector as any).mockReturnValue(mockOnChangePage);
    (useChatUpdate as any).mockReturnValue({ onUpdateChat: mockOnUpdateChat });
    (updateChatToIChat as any).mockImplementation((chat: BusterChat) => ({
      iChat: { ...chat, id: 'test-chat-id' },
      iChatMessages: {
        msg1: { id: 'msg1', content: 'test message' }
      }
    }));
  });

  it('should initialize a new chat with single message and navigate', () => {
    const { result } = renderHook(() => useInitializeChat(), {
      wrapper: createWrapper()
    });

    const mockChat: BusterChat = {
      ...MOCK_CHAT(),
      message_ids: ['msg1']
    };

    result.current.initializeNewChat(mockChat);

    expect(updateChatToIChat).toHaveBeenCalledWith(mockChat, true);
    expect(mockOnUpdateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-chat-id'
      })
    );
    expect(mockOnChangePage).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: 'test-chat-id'
    });
  });

  it('should initialize a new chat with multiple messages without navigation', () => {
    const { result } = renderHook(() => useInitializeChat(), {
      wrapper: createWrapper()
    });

    const mockChat: BusterChat = {
      ...MOCK_CHAT(),
      message_ids: ['msg1', 'msg2', 'msg3']
    };

    result.current.initializeNewChat(mockChat);

    expect(updateChatToIChat).toHaveBeenCalledWith(mockChat, true);
    expect(mockOnUpdateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-chat-id'
      })
    );
    expect(mockOnChangePage).not.toHaveBeenCalled();
  });
});
