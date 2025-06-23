'use client';

import { create } from 'mutative';
import type React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterChat, FileType } from '@/api/asset_interfaces';
import {
  useStartNewChat,
  useGetChatMemoized,
  useGetChatMessageMemoized,
  useStopChat
} from '@/api/buster_rest/chats';
import { useMemoizedFn } from '@/hooks';
import { useChatUpdate } from './useChatUpdate';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { BusterRoutes } from '@/routes/busterRoutes';

export const useBusterNewChat = () => {
  const { mutateAsync: startNewChat } = useStartNewChat();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const getChatMemoized = useGetChatMemoized();
  const { onUpdateChat, onUpdateChatMessage } = useChatUpdate();
  const { mutate: stopChatMutation } = useStopChat();

  const initializeNewChat = useMemoizedFn(({ message_ids, id }: BusterChat) => {
    const hasMultipleMessages = message_ids.length > 1;
    if (!hasMultipleMessages) {
      onChangePage({
        route: BusterRoutes.APP_CHAT_ID,
        chatId: id
      });
    }
  });

  const _startChat = useMemoizedFn(
    async ({
      prompt,
      datasetId,
      metricId,
      dashboardId,
      messageId,
      chatId
    }: {
      prompt: string | undefined;
      datasetId?: string; //unused for now
      metricId?: string; //this is to start a NEW chat from a metric
      dashboardId?: string; //this is to start a NEW chat from a dashboard
      messageId?: string; //this is used to replace a message in the chat
      chatId?: string; //this is used to follow up a chat
    }) => {
      const res = await startNewChat({
        prompt,
        chat_id: chatId,
        metric_id: metricId,
        dashboard_id: dashboardId,
        message_id: messageId
      });

      initializeNewChat(res);
    }
  );

  const onStartNewChat = useMemoizedFn(async ({ prompt }: { prompt: string }) => {
    return _startChat({
      prompt
    });
  });

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
      return _startChat({
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
        final_reasoning_message: null
      });

      if (messageIndex !== -1 && typeof messageIndex === 'number') {
        const updatedMessageIds = currentChat?.message_ids.slice(0, messageIndex + 1);
        onUpdateChat({
          id: chatId,
          message_ids: updatedMessageIds
        });
      }

      return _startChat({
        prompt,
        messageId
      });
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, chatId }: { prompt: string; chatId: string }) => {
      return _startChat({
        prompt,
        chatId
      });
    }
  );

  const onStopChat = useMemoizedFn(
    ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      stopChatMutation(chatId);
    }
  );

  return {
    onStartNewChat,
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
