import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { SelectedFile } from '../interfaces';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useGetChat } from '@/api/buster_rest/chats';
import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { useChatLayoutContextSelector } from '..';
import { MetricVersionProvider } from '@/api/buster_rest/metrics/metricQueryHelpers';

const useChatIndividualContext = ({
  chatId,
  selectedFile,
  onSetSelectedFile
}: {
  chatId?: string;
  selectedFile: SelectedFile | null;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  //CHAT
  const { data: chat } = useGetChat(
    { id: chatId || '' },
    { select: (x) => ({ title: x.title, message_ids: x.message_ids, id: x.id }) }
  );
  const hasChat = !!chatId && !!chat?.id;
  const chatTitle = chat?.title;
  const chatMessageIds = chat?.message_ids ?? [];

  //FILE
  const hasFile = !!selectedFileId;

  //MESSAGES
  const currentMessageId = chatMessageIds[chatMessageIds.length - 1];

  const isStreamingMessage = useQueries({
    queries: chatMessageIds.map((messageId) => {
      const queryKey = queryKeys.chatsMessages(messageId);
      return {
        ...queryKey,
        select: (data: IBusterChatMessage | undefined) => !data?.isCompletedStream,
        enabled: false
      };
    }),
    combine: (result) => result.some((res) => res.data)
  });

  useAutoChangeLayout({
    lastMessageId: currentMessageId,
    selectedFileId,
    chatId
  });

  return React.useMemo(
    () => ({
      hasChat,
      hasFile,
      selectedFileId,
      currentMessageId,
      chatTitle,
      selectedFileType,
      chatMessageIds,
      chatId,
      isStreamingMessage
    }),
    [
      hasChat,
      hasFile,
      isStreamingMessage,
      selectedFileId,
      currentMessageId,
      chatTitle,
      selectedFileType,
      chatMessageIds,
      chatId
    ]
  );
};

const IndividualChatContext = createContext<ReturnType<typeof useChatIndividualContext>>(
  {} as ReturnType<typeof useChatIndividualContext>
);

export const ChatContextProvider = React.memo(({ children }: PropsWithChildren<{}>) => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const useChatContextValue = useChatIndividualContext({
    chatId,
    selectedFile,
    onSetSelectedFile
  });

  return (
    <MetricVersionProvider>
      <IndividualChatContext.Provider value={useChatContextValue}>
        {children}
      </IndividualChatContext.Provider>
    </MetricVersionProvider>
  );
});

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatIndividualContext>) => T
) => useContextSelector(IndividualChatContext, selector);
