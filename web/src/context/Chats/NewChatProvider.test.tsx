import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBusterNewChat } from './NewChatProvider';
import {
  useStartNewChat,
  useGetChatMemoized,
  useGetChatMessageMemoized,
  useStopChat
} from '@/api/buster_rest/chats';
import { useInitializeChat } from './useInitializeChat';

// Mock dependencies
vi.mock('@/api/buster_rest/chats', () => ({
  useStartNewChat: vi.fn(),
  useGetChatMemoized: vi.fn(),
  useGetChatMessageMemoized: vi.fn(),
  useStopChat: vi.fn()
}));

vi.mock('./useInitializeChat', () => ({
  useInitializeChat: vi.fn()
}));

vi.mock('./useChatUpdate', () => ({
  useChatUpdate: vi.fn(() => ({
    onUpdateChat: vi.fn(),
    onUpdateChatMessage: vi.fn()
  }))
}));

describe('useBusterNewChat', () => {
  const mockStartNewChat = vi.fn();
  const mockInitializeNewChat = vi.fn();
  const mockStopChat = vi.fn();
  const mockGetChatMemoized = vi.fn();
  const mockGetChatMessageMemoized = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStartNewChat as any).mockReturnValue({ mutateAsync: mockStartNewChat });
    (useInitializeChat as any).mockReturnValue({ initializeNewChat: mockInitializeNewChat });
    (useStopChat as any).mockReturnValue({ mutate: mockStopChat });
    (useGetChatMemoized as any).mockReturnValue(mockGetChatMemoized);
    (useGetChatMessageMemoized as any).mockReturnValue(mockGetChatMessageMemoized);
  });

  describe('onStartNewChat', () => {
    it('should start a new chat with basic prompt', async () => {
      const mockResponse = { id: 'chat-123', message_ids: [] };
      mockStartNewChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBusterNewChat());

      await result.current.onStartNewChat({
        prompt: 'Test prompt'
      });

      expect(mockStartNewChat).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        metric_id: undefined,
        dashboard_id: undefined
      });
      expect(mockInitializeNewChat).toHaveBeenCalledWith(mockResponse);
    });

    it('should start a new chat with metric ID', async () => {
      const mockResponse = { id: 'chat-123', message_ids: [] };
      mockStartNewChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBusterNewChat());

      await result.current.onStartChatFromFile({
        prompt: 'Test prompt',
        fileId: 'metric-123',
        fileType: 'metric'
      });

      expect(mockStartNewChat).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        metric_id: 'metric-123',
        dashboard_id: undefined,
        message_id: undefined
      });
      expect(mockInitializeNewChat).toHaveBeenCalledWith(mockResponse);
    });

    it('should start a new chat with dashboard ID', async () => {
      const mockResponse = { id: 'chat-123', message_ids: [] };
      mockStartNewChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBusterNewChat());

      await result.current.onStartChatFromFile({
        prompt: 'Test prompt',
        fileId: 'dashboard-123',
        fileType: 'dashboard'
      });

      expect(mockStartNewChat).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        metric_id: undefined,
        dashboard_id: 'dashboard-123'
      });
      expect(mockInitializeNewChat).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('onStartChatFromFile', () => {
    it('should start a chat from a metric file', async () => {
      const mockResponse = { id: 'chat-123', message_ids: [] };
      mockStartNewChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBusterNewChat());

      await result.current.onStartChatFromFile({
        prompt: 'Test prompt',
        fileId: 'file-123',
        fileType: 'metric'
      });

      expect(mockStartNewChat).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        metric_id: 'file-123',
        dashboard_id: undefined
      });
      expect(mockInitializeNewChat).toHaveBeenCalledWith(mockResponse);
    });

    it('should start a chat from a dashboard file', async () => {
      const mockResponse = { id: 'chat-123', message_ids: [] };
      mockStartNewChat.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBusterNewChat());

      await result.current.onStartChatFromFile({
        prompt: 'Test prompt',
        fileId: 'file-123',
        fileType: 'dashboard'
      });

      expect(mockStartNewChat).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        metric_id: undefined,
        dashboard_id: 'file-123'
      });
      expect(mockInitializeNewChat).toHaveBeenCalledWith(mockResponse);
    });
  });
});
