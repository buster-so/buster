import React, { PropsWithChildren, useCallback, useRef, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn, useMount } from 'ahooks';
import { useBusterWebSocket } from '../BusterWebSocket';
import type { BusterThreadStepEvent_FetchingData } from '@/api/buster-rest';
import type { BusterMessageData } from '../Threads';

const DEFAULT_MESSAGE_DATA: BusterMessageData = {
  retrievedData: false,
  fetchingData: false,
  updatedAt: 0,
  data_metadata: null,
  code: null
};

const useMessageData = () => {
  const busterSocket = useBusterWebSocket();
  const [isPending, startTransition] = useTransition();
  // const [messageData, setMessageData] = useState<Record<string, BusterMessageData>>({});

  const messageData = useRef<Record<string, BusterMessageData>>({});

  const _setMessageData = useMemoizedFn(
    (messageId: string, newMessageData: Partial<BusterMessageData>) => {
      const prev = messageData.current[messageId];
      messageData.current = {
        ...messageData.current,
        [messageId]: { ...prev, ...newMessageData }
      };
      startTransition(() => {
        // just used to trigger a re-render
      });
    }
  );

  const _onGetFetchingData = useMemoizedFn((payload: BusterThreadStepEvent_FetchingData) => {
    const { data, data_metadata, code, message_id: messageId, progress } = payload;
    const currentMessage = getMessageData(messageId);
    const fallbackData = data || currentMessage?.data;
    const fallbackDataMetadata = data_metadata || currentMessage?.data_metadata;
    const isCompleted = progress === 'completed';

    onSetMessageData({
      messageId,
      data: fallbackData,
      data_metadata: fallbackDataMetadata,
      isDataFromRerun: false,
      retrievedData: isCompleted,
      fetchingData: !isCompleted,
      code
    });
  });

  const onSetLoadingMessageData = useMemoizedFn(
    ({
      messageId,
      ...params
    }: {
      messageId: string;
      data_metadata?: BusterMessageData['data_metadata'];
      code: string | null;
    }) => {
      _setMessageData(messageId, { ...params, fetchingData: true });
    }
  );

  const onSetMessageData = useMemoizedFn(
    ({
      messageId,
      data,
      data_metadata,
      isDataFromRerun,
      retrievedData,
      fetchingData,
      code
    }: {
      messageId: string;
      data: BusterMessageData['data'];
      data_metadata?: BusterMessageData['data_metadata'];
      isDataFromRerun?: boolean;
      retrievedData?: boolean;
      fetchingData?: boolean;
      code: string | null;
    }) => {
      const setKey = isDataFromRerun ? 'dataFromRerun' : 'data';
      const prev = getMessageData(messageId);
      _setMessageData(messageId, {
        [setKey]: data,
        updatedAt: Date.now(),
        retrievedData: retrievedData ?? true,
        fetchingData: fetchingData ?? false,
        data_metadata: data_metadata ?? prev?.data_metadata,
        code
      });
    }
  );

  const onSetMessageDataCode = useMemoizedFn(
    ({ messageId, code }: { messageId: string; code: string }) => {
      _setMessageData(messageId, { code });
    }
  );

  const getDataByMessageId = useMemoizedFn(async ({ messageId }: { messageId: string }) => {
    const selectedMessageData = getMessageData(messageId);
    if (selectedMessageData?.fetchingData || selectedMessageData?.retrievedData) {
      return;
    }

    _setMessageData(messageId, {
      fetchingData: true
    });

    return await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/threads/messages/data',
        payload: { id: messageId }
      },
      responseEvent: {
        route: '/threads/get:fetchingData',
        callback: _onGetFetchingData
      }
    });
  });

  const getMessageData = useCallback(
    (messageId: string | undefined) => {
      if (messageId && messageData.current[messageId]) {
        return messageData.current[messageId];
      }
      return DEFAULT_MESSAGE_DATA;
    },
    [isPending]
  );

  const getAllMessageDataMemoized = useMemoizedFn(() => {
    return messageData.current;
  });

  useMount(() => {
    busterSocket.on({
      route: '/threads/get:fetchingData',
      callback: _onGetFetchingData
    });
  });

  return {
    onSetMessageDataCode,
    onSetMessageData,
    onSetLoadingMessageData,
    getDataByMessageId,
    getMessageData,
    getAllMessageDataMemoized
  };
};

const BusterMessageDataContext = createContext<ReturnType<typeof useMessageData>>(
  {} as ReturnType<typeof useMessageData>
);

export const BusterMessageDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const messageDataContext = useMessageData();

  return (
    <BusterMessageDataContext.Provider value={messageDataContext}>
      {children}
    </BusterMessageDataContext.Provider>
  );
};
BusterMessageDataProvider.displayName = 'BusterMessageDataProvider';

export const useBusterMessageDataContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useMessageData>, T>
) => {
  return useContextSelector(BusterMessageDataContext, selector);
};
