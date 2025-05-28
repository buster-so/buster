import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as requests from './requests';
import {
  useGetListChats,
  useUpdateChat,
  useDeleteChat,
  useStartChatFromAsset,
  useUpdateChatMessageFeedback
} from './queryRequests';
import type { IBusterChat } from '@/api/asset_interfaces/chat/iChatInterfaces';
import type React from 'react';

// Mock the hooks and requests
jest.mock('@/hooks', () => ({
  useMemoizedFn: (fn: any) => fn
}));

jest.mock('./requests', () => ({
  getListChats: jest.fn(),
  getChat: jest.fn(),
  updateChat: jest.fn(),
  deleteChat: jest.fn(),
  startChatFromAsset: jest.fn(),
  updateChatMessageFeedback: jest.fn()
}));

jest.mock('@/lib/chat', () => ({
  updateChatToIChat: jest.fn().mockImplementation((chat: IBusterChat) => ({
    iChat: { ...chat, message_ids: ['msg1'] },
    iChatMessages: { msg1: { id: 'msg1', content: 'test' } }
  }))
}));

jest.mock('@/context/BusterNotifications', () => ({
  useBusterNotifications: () => ({
    openConfirmModal: jest
      .fn()
      .mockImplementation(({ onOk }: { onOk: () => Promise<any> }) => onOk())
  })
}));

// Test wrapper setup
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  // eslint-disable-next-line react/display-name
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('Chat Query Hooks', () => {
  const mockChat = {
    id: 'test-chat-id',
    title: 'Test Chat',
    message_ids: ['msg1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isNewChat: false,
    is_favorited: false,
    created_by: 'test-user',
    created_by_id: 'test-user-id'
  } as IBusterChat;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGetListChats', () => {
    it('should fetch list of chats with custom filters', async () => {
      const mockChats = [mockChat];
      (requests.getListChats as jest.Mock).mockResolvedValueOnce(mockChats);

      const filters = { search: 'test' };
      const { result } = renderHook(() => useGetListChats(filters), {
        wrapper: createWrapper()
      });

      await waitFor(
        () => {
          expect(result.current.isFetching).toBe(false);
          expect(result.current.data).toBeDefined();
        },
        { timeout: 2000 }
      );

      expect(requests.getListChats).toHaveBeenCalledWith({
        admin_view: false,
        page_token: 0,
        page_size: 3500,
        search: 'test'
      });
    });
  });

  describe('useUpdateChat', () => {
    it('should update chat title', async () => {
      const updateData = { id: 'test-chat-id', title: 'Updated Title' };
      (requests.updateChat as jest.Mock).mockResolvedValueOnce(updateData);

      const { result } = renderHook(() => useUpdateChat(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.mutateAsync(updateData);
      });

      expect(requests.updateChat).toHaveBeenCalledWith(updateData);
    });
  });

  describe('useDeleteChat', () => {
    it('should delete chat with confirmation', async () => {
      (requests.deleteChat as jest.Mock).mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useDeleteChat(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.mutateAsync({
          data: { id: 'test-chat-id' } as any,
          useConfirmModal: true
        });
      });

      expect(requests.deleteChat).toHaveBeenCalledWith({ id: 'test-chat-id' });
    });
  });

  describe('useStartChatFromAsset', () => {
    it('should start a new chat from asset', async () => {
      (requests.startChatFromAsset as jest.Mock).mockResolvedValueOnce(mockChat);

      const { result } = renderHook(() => useStartChatFromAsset(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.mutateAsync({
          asset_id: 'test-asset-id',
          asset_type: 'dashboard'
        });
      });

      expect(requests.startChatFromAsset).toHaveBeenCalledWith({
        asset_id: 'test-asset-id',
        asset_type: 'dashboard'
      });
    });
  });

  describe('useUpdateChatMessageFeedback', () => {
    it('should update chat message feedback', async () => {
      const feedbackData = {
        message_id: 'msg1',
        feedback: 'negative' as const
      };
      (requests.updateChatMessageFeedback as jest.Mock).mockResolvedValueOnce(feedbackData);

      const { result } = renderHook(() => useUpdateChatMessageFeedback(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.mutateAsync(feedbackData);
      });

      expect(requests.updateChatMessageFeedback).toHaveBeenCalledWith(feedbackData);
    });
  });
});
