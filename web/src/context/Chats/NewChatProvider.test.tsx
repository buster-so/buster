import { act, renderHook } from '@testing-library/react';
import { create } from 'mutative';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useBusterNewChat } from './NewChatProvider';
import { useChatStreamMessage } from './useInitializeChat';
import { useChatUpdate } from './useChatUpdate';

// Mock dependencies
vi.mock('@/hooks', () => ({
  useMemoizedFn: (fn: any) => fn
}));

vi.mock('@/context/BusterWebSocket');
vi.mock('./useChatStreamMessage');
vi.mock('@/api/buster_rest/chats');
vi.mock('./useChatUpdate');
vi.mock('mutative');

const mockUseBusterWebSocket = useBusterWebSocket as any;
const mockUseChatStreamMessage = useChatStreamMessage as any;
const mockUseGetChatMemoized = useGetChatMemoized as any;
const mockUseGetChatMessageMemoized = useGetChatMessageMemoized as any;
const mockUseChatUpdate = useChatUpdate as any;
const mockCreate = create as any;

describe('useBusterNewChat', () => {
  let mockBusterSocket: {
    emitAndOnce: any;
    once: any;
    emit: any;
  };
  let mockInitializeNewChatCallback: any;
  let mockCompleteChatCallback: any;
  let mockStopChatCallback: any;
  let mockGetChatMemoized: any;
  let mockGetChatMessageMemoized: any;
  let mockOnUpdateChat: any;
  let mockOnUpdateChatMessage: any;

  beforeEach(() => {
    mockBusterSocket = {
      emitAndOnce: vi.fn().mockResolvedValue({}),
      once: vi.fn(),
      emit: vi.fn()
    };
    mockUseBusterWebSocket.mockReturnValue(mockBusterSocket);

    mockInitializeNewChatCallback = vi.fn();
    mockCompleteChatCallback = vi.fn();
    mockStopChatCallback = vi.fn();
    mockUseChatStreamMessage.mockReturnValue({
      initializeNewChatCallback: mockInitializeNewChatCallback,
      completeChatCallback: mockCompleteChatCallback,
      stopChatCallback: mockStopChatCallback
    });

    mockGetChatMemoized = vi.fn();
    mockUseGetChatMemoized.mockReturnValue(mockGetChatMemoized);

    mockGetChatMessageMemoized = vi.fn();
    mockUseGetChatMessageMemoized.mockReturnValue(mockGetChatMessageMemoized);

    mockOnUpdateChat = vi.fn();
    mockOnUpdateChatMessage = vi.fn();
    mockUseChatUpdate.mockReturnValue({
      onUpdateChat: mockOnUpdateChat,
      onUpdateChatMessage: mockOnUpdateChatMessage
    });

    mockCreate.mockImplementation((base: any, updater: any) => {
      const draft = JSON.parse(JSON.stringify(base));
      updater(draft);
      return draft;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: onSelectSearchAsset should resolve after a delay (mocked)
  it('onSelectSearchAsset should complete', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBusterNewChat());
    const promise = result.current.onSelectSearchAsset({
      id: 'asset1',
      name: 'Asset 1',
      type: ShareAssetType.METRIC,
      highlights: [],
      updated_at: new Date().toISOString(),
      score: 0
    });

    act(() => {
      vi.runAllTimers();
    });

    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  // Test 2: onStartNewChat should call busterSocket.emitAndOnce and busterSocket.once
  it('onStartNewChat should call socket methods with correct parameters', async () => {
    const { result } = renderHook(() => useBusterNewChat());
    const chatPayload = { prompt: 'Hello' };

    await result.current.onStartNewChat(chatPayload);

    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith({
      emitEvent: {
        route: '/chats/post',
        payload: {
          dataset_id: undefined,
          prompt: 'Hello',
          metric_id: undefined,
          dashboard_id: undefined
        }
      },
      responseEvent: {
        route: '/chats/post:initializeChat',
        callback: mockInitializeNewChatCallback
      }
    });
    expect(mockBusterSocket.once).toHaveBeenCalledWith({
      route: '/chats/post:complete',
      callback: mockCompleteChatCallback
    });
  });

  // Test 3: onStartNewChat should include datasetId if provided
  it('onStartNewChat should include datasetId when provided', async () => {
    const { result } = renderHook(() => useBusterNewChat());
    const chatPayload = { prompt: 'Test with dataset', datasetId: 'ds1' };

    await result.current.onStartNewChat(chatPayload);

    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        emitEvent: expect.objectContaining({
          payload: expect.objectContaining({ dataset_id: 'ds1' })
        })
      })
    );
  });

  // Test 4: onStartChatFromFile should call onStartNewChat with metricId for metric fileType
  it('onStartChatFromFile should call onStartNewChat with metricId for metric type', async () => {
    const { result } = renderHook(() => useBusterNewChat());

    const filePayload = {
      prompt: 'Chat from metric',
      fileId: 'metric123',
      fileType: 'metric' as const
    };
    await result.current.onStartChatFromFile(filePayload);

    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        emitEvent: expect.objectContaining({
          payload: expect.objectContaining({
            prompt: 'Chat from metric',
            metric_id: 'metric123',
            dashboard_id: undefined
          })
        })
      })
    );
  });

  // Test 5: onStartChatFromFile should call onStartNewChat with dashboardId for dashboard fileType
  it('onStartChatFromFile should call onStartNewChat with dashboardId for dashboard type', async () => {
    const { result } = renderHook(() => useBusterNewChat());

    const filePayload = {
      prompt: 'Chat from dashboard',
      fileId: 'dash123',
      fileType: 'dashboard' as const
    };
    await result.current.onStartChatFromFile(filePayload);

    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        emitEvent: expect.objectContaining({
          payload: expect.objectContaining({
            prompt: 'Chat from dashboard',
            metric_id: undefined,
            dashboard_id: 'dash123'
          })
        })
      })
    );
  });

  // Test 6: onFollowUpChat should call socket methods with correct parameters
  it('onFollowUpChat should call socket methods with chatId', async () => {
    const { result } = renderHook(() => useBusterNewChat());
    const followUpPayload = { prompt: 'Follow up question', chatId: 'chat1' };

    await result.current.onFollowUpChat(followUpPayload);

    expect(mockBusterSocket.once).toHaveBeenCalledWith({
      route: '/chats/post:initializeChat',
      callback: mockInitializeNewChatCallback
    });
    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith({
      emitEvent: {
        route: '/chats/post',
        payload: {
          prompt: 'Follow up question',
          chat_id: 'chat1'
        }
      },
      responseEvent: {
        route: '/chats/post:complete',
        callback: mockCompleteChatCallback
      }
    });
  });

  // Test 7: onStopChat should call busterSocket.emit and stopChatCallback
  it('onStopChat should call emit and stopChatCallback', () => {
    const { result } = renderHook(() => useBusterNewChat());
    const stopPayload = { chatId: 'chat1', messageId: 'msg1' };

    result.current.onStopChat(stopPayload);

    expect(mockBusterSocket.emit).toHaveBeenCalledWith({
      route: '/chats/stop',
      payload: {
        id: 'chat1',
        message_id: 'msg1'
      }
    });
    expect(mockStopChatCallback).toHaveBeenCalledWith('chat1');
  });

  // Test 8: onReplaceMessageInChat updates message and chat correctly and calls socket
  it('onReplaceMessageInChat should update message, chat, and call socket', async () => {
    const mockCurrentChat = { id: 'chat1', message_ids: ['msg0', 'msg1', 'msg2'] };
    const mockCurrentMessage = { id: 'msg1', request_message: { request: 'Old prompt' } };

    mockGetChatMemoized.mockReturnValue(mockCurrentChat);
    mockGetChatMessageMemoized.mockReturnValue(mockCurrentMessage);

    const { result } = renderHook(() => useBusterNewChat());
    const replacePayload = { prompt: 'New prompt', messageId: 'msg1', chatId: 'chat1' };

    await result.current.onReplaceMessageInChat(replacePayload);

    expect(mockGetChatMemoized).toHaveBeenCalledWith('chat1');
    expect(mockGetChatMessageMemoized).toHaveBeenCalledWith('msg1');

    expect(mockOnUpdateChatMessage).toHaveBeenCalledWith({
      id: 'msg1',
      request_message: { request: 'New prompt' },
      reasoning_message_ids: [],
      response_message_ids: [],
      reasoning_messages: {},
      final_reasoning_message: null,
      isCompletedStream: false
    });

    expect(mockOnUpdateChat).toHaveBeenCalledWith({
      id: 'chat1',
      message_ids: ['msg0', 'msg1']
    });

    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith({
      emitEvent: {
        route: '/chats/post',
        payload: {
          prompt: 'New prompt',
          message_id: 'msg1',
          chat_id: 'chat1'
        }
      },
      responseEvent: {
        route: '/chats/post:complete',
        callback: mockCompleteChatCallback
      }
    });
  });

  // Test 9: onReplaceMessageInChat handles message not found in chat but still calls socket
  it('onReplaceMessageInChat should not update chat if message not found, but still calls socket', async () => {
    const mockCurrentChat = { id: 'chat1', message_ids: ['msg0', 'msg2'] }; // msg1 is missing
    const mockCurrentMessage = { id: 'msg1', request_message: { request: 'Old prompt' } };

    mockGetChatMemoized.mockReturnValue(mockCurrentChat);
    mockGetChatMessageMemoized.mockReturnValue(mockCurrentMessage);

    const { result } = renderHook(() => useBusterNewChat());
    const replacePayload = { prompt: 'New prompt', messageId: 'msg1', chatId: 'chat1' };

    await result.current.onReplaceMessageInChat(replacePayload);

    expect(mockOnUpdateChatMessage).toHaveBeenCalled();
    expect(mockOnUpdateChat).not.toHaveBeenCalled();
    expect(mockBusterSocket.emitAndOnce).toHaveBeenCalledWith({
      emitEvent: {
        route: '/chats/post',
        payload: {
          prompt: 'New prompt',
          message_id: 'msg1',
          chat_id: 'chat1'
        }
      },
      responseEvent: {
        route: '/chats/post:complete',
        callback: mockCompleteChatCallback
      }
    });
  });
});
