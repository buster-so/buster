import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useAutoRedirectStreaming } from './useAutoRedirectStreaming';

// Mock all the dependencies
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('@/api/buster_rest/chats', () => ({
  useGetChatMessageMemoized: vi.fn(),
}));

vi.mock('@/context/AppVersion/useAppVersion', () => ({
  useIsVersionChanged: vi.fn(),
}));

vi.mock('@/context/Chats/useGetChat', () => ({
  useHasLoadedChat: vi.fn(),
}));

vi.mock('@/context/Chats/useGetChatMessage', () => ({
  useGetChatMessageCompleted: vi.fn(),
  useGetChatMessageHasResponseFile: vi.fn(),
  useGetChatMessageIsFinishedReasoning: vi.fn(),
  useGetChatMessageLastReasoningMessageId: vi.fn(),
}));

vi.mock('@/hooks/useWindowFocus', () => ({
  useWindowFocus: vi.fn(),
}));

vi.mock('@/lib/assets/assetParamsToRoute', () => ({
  assetParamsToRoute: vi.fn(),
}));

// Import the mocked functions to use in tests
import { useNavigate } from '@tanstack/react-router';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useIsVersionChanged } from '@/context/AppVersion/useAppVersion';
import { useHasLoadedChat } from '@/context/Chats/useGetChat';
import {
  useGetChatMessageCompleted,
  useGetChatMessageHasResponseFile,
  useGetChatMessageIsFinishedReasoning,
  useGetChatMessageLastReasoningMessageId,
} from '@/context/Chats/useGetChatMessage';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

describe('useAutoRedirectStreaming', () => {
  const defaultProps = {
    lastMessageId: 'message-123',
    chatId: 'chat-456',
  };

  const mockChatMessage = {
    id: 'message-123',
    response_message_ids: ['file-789'],
    response_messages: {
      'file-789': {
        id: 'file-789',
        type: 'file',
        file_type: 'dashboard_file',
        file_name: 'Test Dashboard',
        version_number: 1,
      } as BusterChatResponseMessage_file,
    },
  };

  let mockNavigateFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup navigation mock
    mockNavigateFn = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigateFn);

    // Set default mock implementations
    vi.mocked(useHasLoadedChat).mockReturnValue(true);
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageHasResponseFile).mockReturnValue(false);
    vi.mocked(useGetChatMessageIsFinishedReasoning).mockReturnValue(false);
    vi.mocked(useGetChatMessageLastReasoningMessageId).mockReturnValue(undefined);
    vi.mocked(useIsVersionChanged).mockReturnValue(false);

    // useGetChatMessageMemoized returns a function that returns a message
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => undefined as any);
    vi.mocked(assetParamsToRoute).mockReturnValue({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: 'dashboard-123' },
    } as any);
  });

  it('should navigate to file route when streaming and has file in response', () => {
    // Setup: streaming with file
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(assetParamsToRoute).toHaveBeenCalledWith({
      assetId: 'file-789',
      assetType: 'dashboard_file',
      chatId: 'chat-456',
      versionNumber: 1,
    });

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: 'dashboard-123' },
      replace: true,
      reloadDocument: false,
    });
  });

  it('should navigate to file route when stream completed and has file (first time completion)', () => {
    // Setup: Start with stream not finished, then complete it to simulate first-time completion
    const mockCompleted = vi.mocked(useGetChatMessageCompleted);
    mockCompleted.mockReturnValue(false); // Start as not completed
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);

    // First render with stream not completed
    const { rerender } = renderHook(() => useAutoRedirectStreaming(defaultProps));

    // Now complete the stream to trigger first-time completion
    mockCompleted.mockReturnValue(true);
    rerender();

    expect(assetParamsToRoute).toHaveBeenCalledWith({
      assetId: 'file-789',
      assetType: 'dashboard_file',
      chatId: 'chat-456',
      versionNumber: 1,
    });

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: 'dashboard-123' },
      replace: true,
      reloadDocument: false,
    });
  });

  it('should navigate to reasoning route when streaming with reasoning but not finished', () => {
    // Setup: streaming with reasoning, not finished
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageIsFinishedReasoning).mockReturnValue(false);
    vi.mocked(useGetChatMessageLastReasoningMessageId).mockReturnValue('reasoning-123');
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(
      () => ({ response_message_ids: [] }) as any
    );

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/chats/$chatId/reasoning/$messageId',
      params: {
        chatId: 'chat-456',
        messageId: 'message-123',
      },
      replace: true,
      reloadDocument: false,
    });
  });

  it('should navigate to chat route when finished reasoning and stream completed (first time)', () => {
    // Setup: Start with stream not finished, then complete it to simulate first-time completion
    const mockCompleted = vi.mocked(useGetChatMessageCompleted);
    mockCompleted.mockReturnValue(false); // Start as not completed
    vi.mocked(useGetChatMessageIsFinishedReasoning).mockReturnValue(true);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(
      () => ({ response_message_ids: [] }) as any
    );

    // First render with stream not completed
    const { rerender } = renderHook(() => useAutoRedirectStreaming(defaultProps));

    // Now complete the stream to trigger first-time completion
    mockCompleted.mockReturnValue(true);
    rerender();

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/chats/$chatId',
      params: {
        chatId: 'chat-456',
      },
      replace: true,
      reloadDocument: false,
    });
  });

  it('should not navigate when chat has not loaded', () => {
    // Setup: chat not loaded
    vi.mocked(useHasLoadedChat).mockReturnValue(false);
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(mockNavigateFn).not.toHaveBeenCalled();
  });

  it('should not navigate when chatId is undefined', () => {
    // Setup: no chatId
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);

    renderHook(() => useAutoRedirectStreaming({ ...defaultProps, chatId: undefined }));

    expect(mockNavigateFn).not.toHaveBeenCalled();
  });

  it('should navigate with version changed flag when version changed', () => {
    // Setup: streaming with file, version changed
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);
    vi.mocked(useIsVersionChanged).mockReturnValue(true);

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/dashboards/$dashboardId',
      params: { dashboardId: 'dashboard-123' },
      replace: true,
      reloadDocument: true,
    });
  });

  it('should handle metric file type navigation correctly', () => {
    // Setup: streaming with metric file
    const metricChatMessage = {
      id: 'message-123',
      response_message_ids: ['metric-789'],
      response_messages: {
        'metric-789': {
          id: 'metric-789',
          type: 'file',
          file_type: 'metric_file',
          file_name: 'Test Metric',
          version_number: 2,
        } as BusterChatResponseMessage_file,
      },
    };

    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => metricChatMessage as any);
    vi.mocked(assetParamsToRoute).mockReturnValue({
      to: '/app/metrics/$metricId',
      params: { metricId: 'metric-123' },
    } as any);

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(assetParamsToRoute).toHaveBeenCalledWith({
      assetId: 'metric-789',
      assetType: 'metric_file',
      chatId: 'chat-456',
      versionNumber: 2,
    });

    expect(mockNavigateFn).toHaveBeenCalledWith({
      to: '/app/metrics/$metricId',
      params: { metricId: 'metric-123' },
      replace: true,
      reloadDocument: false,
    });
  });

  it('should not navigate when streaming is completed and it was already a completed stream', () => {
    // Setup: Simulate a stream that completes with a file, then gets re-rendered
    const mockCompleted = vi.mocked(useGetChatMessageCompleted);
    mockCompleted.mockReturnValue(false); // Start as not completed

    // Start without a file, so first render doesn't navigate
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(
      () => ({ response_message_ids: [] }) as any
    );

    // First render - stream not completed yet, no file
    const { rerender } = renderHook(() => useAutoRedirectStreaming(defaultProps));
    expect(mockNavigateFn).not.toHaveBeenCalled();

    // Complete the stream AND add a file - should trigger navigation (first time)
    mockCompleted.mockReturnValue(true);
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(() => mockChatMessage as any);
    rerender();
    expect(mockNavigateFn).toHaveBeenCalledTimes(1);

    // Reset the navigation mock and re-render - should not navigate again (previousIsCompletedStream = true)
    mockNavigateFn.mockClear();
    rerender();
    expect(mockNavigateFn).not.toHaveBeenCalled();
  });

  it('should not navigate to reasoning when reasoning is finished', () => {
    // Setup: streaming with reasoning but reasoning is finished
    vi.mocked(useGetChatMessageCompleted).mockReturnValue(false);
    vi.mocked(useGetChatMessageIsFinishedReasoning).mockReturnValue(true);
    vi.mocked(useGetChatMessageLastReasoningMessageId).mockReturnValue('reasoning-123');
    vi.mocked(useGetChatMessageMemoized).mockReturnValue(
      () => ({ response_message_ids: [] }) as any
    );

    renderHook(() => useAutoRedirectStreaming(defaultProps));

    expect(mockNavigateFn).not.toHaveBeenCalled();
  });
});
