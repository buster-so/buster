import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { BusterSearchResult, FileType } from '@/api/asset_interfaces';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useChatStreamMessage } from './useChatStreamMessage';

export const useBusterNewChat = () => {
  const busterSocket = useBusterWebSocket();

  const {
    completeChatCallback,
    stopChatCallback,
    initializeNewChatCallback,
    replaceMessageCallback
  } = useChatStreamMessage();

  const onSelectSearchAsset = useMemoizedFn(async (asset: BusterSearchResult) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  const onStartNewChat = useMemoizedFn(
    async ({
      prompt,
      datasetId,
      metricId,
      dashboardId
    }: {
      prompt: string;
      datasetId?: string;
      metricId?: string;
      dashboardId?: string;
    }) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/chats/post',
          payload: {
            dataset_id: datasetId, //TODO: add selected dataset id
            prompt,
            metric_id: metricId,
            dashboard_id: dashboardId
          }
        },
        responseEvent: {
          route: '/chats/post:initializeChat',
          callback: initializeNewChatCallback
        }
      });

      busterSocket.once({
        route: '/chats/post:complete',
        callback: completeChatCallback
      });
    }
  );

  const onStartChatFromFile = useMemoizedFn(
    async ({
      prompt,
      fileId,
      fileType
    }: {
      prompt: string;
      fileId: string;
      fileType: FileType;
    }) => {
      onStartNewChat({
        prompt,
        metricId: fileType === 'metric' ? fileId : undefined,
        dashboardId: fileType === 'dashboard' ? fileId : undefined
      });
    }
  );

  const onReplaceMessageInChat = useMemoizedFn(
    async ({
      prompt,
      messageId,
      chatId
    }: {
      prompt: string;
      messageId: string;
      chatId: string;
    }) => {
      replaceMessageCallback({
        prompt,
        messageId
      });
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/chats/post',
          payload: {
            prompt,
            message_id: messageId,
            chat_id: chatId
          }
        },
        responseEvent: {
          route: '/chats/post:complete',
          callback: completeChatCallback
        }
      });
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, chatId }: { prompt: string; chatId: string }) => {
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/chats/post',
          payload: {
            prompt,
            chat_id: chatId
          }
        },
        responseEvent: {
          route: '/chats/post:complete',
          callback: completeChatCallback
        }
      });
    }
  );

  const onStopChat = useMemoizedFn(
    ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      busterSocket.emit({
        route: '/chats/stop',
        payload: {
          id: chatId,
          message_id: messageId
        }
      });
      stopChatCallback(chatId);
    }
  );

  return {
    onStartNewChat,
    onSelectSearchAsset,
    onFollowUpChat,
    onStartChatFromFile,
    onReplaceMessageInChat,
    onStopChat
  };
};

export const BusterNewChatContext = createContext<ReturnType<typeof useBusterNewChat>>(
  {} as ReturnType<typeof useBusterNewChat>
);

export const BusterNewChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterNewChat();
  return <BusterNewChatContext.Provider value={value}>{children}</BusterNewChatContext.Provider>;
};

export const useBusterNewChatContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterNewChat>) => T
) => useContextSelector(BusterNewChatContext, selector);
