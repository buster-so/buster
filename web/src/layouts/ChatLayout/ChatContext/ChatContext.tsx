import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { SelectedFile } from '../interfaces';
import { useAutoChangeLayout } from './useAutoChangeLayout';
import { useGetChat } from '@/api/buster_rest/chats';
import { useMessageIndividual } from '@/context/Chats';

const useChatIndividualContext = ({
  chatId,
  selectedFile,
  onSetSelectedFile
}: {
  chatId?: string;
  selectedFile?: SelectedFile;
  onSetSelectedFile: (file: SelectedFile) => void;
}) => {
  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  //CHAT
  const { data: chat } = useGetChat({ id: chatId || '' });
  const hasChat = !!chatId && !!chat;
  const chatTitle = chat?.title;
  const chatMessageIds = chat?.message_ids ?? [];

  //FILE
  const hasFile = !!selectedFileId;

  //MESSAGES
  const currentMessageId = chatMessageIds[chatMessageIds.length - 1];
  const isStreamingMessage = useMessageIndividual(currentMessageId, (x) => !x?.isCompletedStream);

  useAutoChangeLayout({
    lastMessageId: currentMessageId,
    onSetSelectedFile
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

export const ChatContextProvider = React.memo(
  ({
    chatId,
    selectedFile,
    onSetSelectedFile,
    children
  }: PropsWithChildren<{
    chatId: string | undefined;
    selectedFile: SelectedFile | undefined;
    onSetSelectedFile: (file: SelectedFile) => void;
  }>) => {
    const useChatContextValue = useChatIndividualContext({
      chatId,
      selectedFile,
      onSetSelectedFile
    });

    return (
      <IndividualChatContext.Provider value={useChatContextValue}>
        {children}
      </IndividualChatContext.Provider>
    );
  }
);

ChatContextProvider.displayName = 'ChatContextProvider';

export const useChatIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatIndividualContext>) => T
) => useContextSelector(IndividualChatContext, selector);
