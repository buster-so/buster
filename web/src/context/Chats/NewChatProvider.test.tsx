import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { act, renderHook } from '@testing-library/react';
import { create } from 'mutative';
import { useBusterNewChat } from './NewChatProvider';
import { useChatStreamMessage } from './useChatStreamMessage';
import { useChatUpdate } from './useChatUpdate';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useMemoizedFn: (fn: any) => fn
}));

jest.mock('@/context/BusterWebSocket');
jest.mock('./useChatStreamMessage');
jest.mock('@/api/buster_rest/chats');
jest.mock('./useChatUpdate');
jest.mock('mutative');

const mockUseBusterWebSocket = useBusterWebSocket as jest.Mock;
const mockUseChatStreamMessage = useChatStreamMessage as jest.Mock;
const mockUseGetChatMemoized = useGetChatMemoized as jest.Mock;
const mockUseGetChatMessageMemoized = useGetChatMessageMemoized as jest.Mock;
const mockUseChatUpdate = useChatUpdate as jest.Mock;
const mockCreate = create as jest.Mock;

describe('useBusterNewChat', () => {
  let mockBusterSocket: {
    emitAndOnce: jest.Mock;
    once: jest.Mock;
    emit: jest.Mock;
  };
  let mockInitializeNewChatCallback: jest.Mock;
  let mockCompleteChatCallback: jest.Mock;
  let mockStopChatCallback: jest.Mock;
  let mockGetChatMemoized: jest.Mock;
  let mockGetChatMessageMemoized: jest.Mock;
  let mockOnUpdateChat: jest.Mock;
  let mockOnUpdateChatMessage: jest.Mock;

  beforeEach(() => {
    mockBusterSocket = {
      emitAndOnce: jest.fn().mockResolvedValue({}),
      once: jest.fn(),
      emit: jest.fn()
    };
    mockUseBusterWebSocket.mockReturnValue(mockBusterSocket);

    mockInitializeNewChatCallback = jest.fn();
    mockCompleteChatCallback = jest.fn();
    mockStopChatCallback = jest.fn();
    mockUseChatStreamMessage.mockReturnValue({
      initializeNewChatCallback: mockInitializeNewChatCallback,
      completeChatCallback: mockCompleteChatCallback,
      stopChatCallback: mockStopChatCallback
    });

    mockGetChatMemoized = jest.fn();
    mockUseGetChatMemoized.mockReturnValue(mockGetChatMemoized);

    mockGetChatMessageMemoized = jest.fn();
    mockUseGetChatMessageMemoized.mockReturnValue(mockGetChatMessageMemoized);

    mockOnUpdateChat = jest.fn();
    mockOnUpdateChatMessage = jest.fn();
    mockUseChatUpdate.mockReturnValue({
      onUpdateChat: mockOnUpdateChat,
      onUpdateChatMessage: mockOnUpdateChatMessage
    });

    mockCreate.mockImplementation((base, updater) => {
      const draft = JSON.parse(JSON.stringify(base));
      updater(draft);
      return draft;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: onSelectSearchAsset should resolve after a delay (mocked)
  test('onSelectSearchAsset should complete', async () => {
    jest.useFakeTimers();
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
      jest.runAllTimers();
    });

    await expect(promise).resolves.toBeUndefined();
    jest.useRealTimers();
  });

  // Test 2: onStartNewChat should call busterSocket.emitAndOnce and busterSocket.once
  test('onStartNewChat should call socket methods with correct parameters', async () => {
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
  test('onStartNewChat should include datasetId when provided', async () => {
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
  test('onStartChatFromFile should call onStartNewChat with metricId for metric type', async () => {
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
  test('onStartChatFromFile should call onStartNewChat with dashboardId for dashboard type', async () => {
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
  test('onFollowUpChat should call socket methods with chatId', async () => {
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
  test('onStopChat should call emit and stopChatCallback', () => {
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
  test('onReplaceMessageInChat should update message, chat, and call socket', async () => {
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
  test('onReplaceMessageInChat should not update chat if message not found, but still calls socket', async () => {
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
