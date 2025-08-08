import { useQueries, useQuery } from '@tanstack/react-query';
import React, { useMemo, type PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChat } from '@/api/buster_rest/chats';
import { queryKeys } from '@/api/query_keys';
import { useChatLayoutContextSelector } from '..';
import type { SelectedFile } from '../interfaces';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useIsFileChanged } from './useIsFileChanged';
import { useChatStreaming } from './useChatStreaming';
import { useChatDocumentTitle } from './useChatDocumentTitle';

const useChatIndividualContext = ({
  chatId,
  selectedFile
}: {
  chatId?: string;
  selectedFile: SelectedFile | null;
}) => {
  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  const { data: chat } = useGetChat(
    { id: chatId || '' },
    {
      select: (data) => ({
        title: data?.title,
        id: data?.id,
        message_ids: data?.message_ids
      })
    }
  );

  // CHAT
  const hasChat = !!chatId && !!chat?.id;
  const chatTitle = chat?.title;
  const chatMessageIds: string[] = chat?.message_ids ?? [];

  //FILE
  const hasFile = !!selectedFileId;

  //MESSAGES
  const currentMessageId = chatMessageIds[chatMessageIds.length - 1];

  const isStreamingMessage = useQueries({
    queries: chatMessageIds.map((messageId) => {
      const queryKey = queryKeys.chatsMessages(messageId);
      return {
        ...queryKey,
        enabled: false,
        select: (data: BusterChatMessage | undefined) => data?.is_completed
      };
    }),
    combine: (result) => result.some((res) => res.data === false)
  });

  const { isFileChanged, onResetToOriginal } = useIsFileChanged({
    selectedFileId,
    selectedFileType
  });

  useAutoChangeLayout({
    lastMessageId: currentMessageId,
    chatId
  });
  useChatStreaming({ chatId, messageId: currentMessageId, isStreamingMessage });
  useChatDocumentTitle({ chatTitle, selectedFileId, selectedFileType });

  return {
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
  };
};

const IndividualChatContext = createContext<ReturnType<typeof useChatIndividualContext>>(
  {} as ReturnType<typeof useChatIndividualContext>
);

export const ChatContextProvider = ({ children }: PropsWithChildren) => {
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
};

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatIndividualContext>) => T
) => useContextSelector(IndividualChatContext, selector);
