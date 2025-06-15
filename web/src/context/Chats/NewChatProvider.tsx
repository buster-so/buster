'use client';

import { create } from 'mutative';
import type React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterSearchResult, FileType } from '@/api/asset_interfaces';
import {
  startNewChat,
  useGetChatMemoized,
  useGetChatMessageMemoized
} from '@/api/buster_rest/chats';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from '@/hooks';
import { useChatStreamMessage } from './useChatStreamMessage';
import { useChatUpdate } from './useChatUpdate';

export const useBusterNewChat = () => {
  const busterSocket = useBusterWebSocket();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const getChatMemoized = useGetChatMemoized();
  const { onUpdateChat, onUpdateChatMessage } = useChatUpdate();

  const { completeChatCallback, stopChatCallback, initializeNewChatCallback } =
    useChatStreamMessage();

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
      const res = await startNewChat({
        prompt,
        metric_id: metricId,
        dashboard_id: dashboardId
      });

      initializeNewChatCallback(res);
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
      const currentChat = getChatMemoized(chatId);
      const currentMessage = getChatMessageMemoized(messageId);
      const currentRequestMessage = currentMessage?.request_message;
      if (!currentRequestMessage) return;

      const messageIndex = currentChat?.message_ids.findIndex((mId) => mId === messageId);

      onUpdateChatMessage({
        id: messageId,
        request_message: create(currentRequestMessage, (draft) => {
          draft.request = prompt;
        }),
        reasoning_message_ids: [],
        response_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: null,
        isCompletedStream: false
      });

      if (messageIndex !== -1 && typeof messageIndex === 'number') {
        const updatedMessageIds = currentChat?.message_ids.slice(0, messageIndex + 1);
        onUpdateChat({
          id: chatId,
          message_ids: updatedMessageIds
        });
      }

      //needed in order to trigger the auto change layout
      busterSocket.once({
        route: '/chats/post:initializeChat',
        callback: initializeNewChatCallback
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
      busterSocket.once({
        route: '/chats/post:initializeChat',
        callback: initializeNewChatCallback
      });
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
