import type { IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChat } from '@/api/buster_rest/chats';
import { queryKeys } from '@/api/query_keys';
import { useQueries } from '@tanstack/react-query';
import React, { type PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useChatLayoutContextSelector } from '..';
import type { SelectedFile } from '../interfaces';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useIsFileChanged } from './useIsFileChanged';

const useChatIndividualContext = ({
  chatId,
  selectedFile
}: {
  chatId?: string;
  selectedFile: SelectedFile | null;
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

  const { isFileChanged, onResetToOriginal } = useIsFileChanged({
    selectedFileId,
    selectedFileType
  });

  useAutoChangeLayout({
    lastMessageId: currentMessageId,
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
      isStreamingMessage,
      isFileChanged,
      onResetToOriginal
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
      chatId,
      isFileChanged,
      onResetToOriginal
    ]
  );
};

const IndividualChatContext = createContext<ReturnType<typeof useChatIndividualContext>>(
  {} as ReturnType<typeof useChatIndividualContext>
);

export const ChatContextProvider = React.memo(({ children }: PropsWithChildren) => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const useChatContextValue = useChatIndividualContext({
    chatId,
    selectedFile
  });

  return (
    <IndividualChatContext.Provider value={useChatContextValue}>
      {children}
    </IndividualChatContext.Provider>
  );
});

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatIndividualContext>) => T
) => useContextSelector(IndividualChatContext, selector);
