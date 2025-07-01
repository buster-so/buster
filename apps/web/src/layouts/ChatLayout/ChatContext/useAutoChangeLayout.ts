'use client';

import findLast from 'lodash/findLast';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessage, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { BusterRoutes } from '@/routes';

export const useAutoChangeLayout = ({
  lastMessageId,
  chatId
}: {
  lastMessageId: string;
  chatId: string | undefined;
}) => {
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);
  const { data: isCompletedStream = false } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.is_completed
  });
  const { data: lastReasoningMessageId } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.reasoning_message_ids?.[x?.reasoning_message_ids?.length - 1]
  });
  const { data: isFinishedReasoning } = useGetChatMessage(lastMessageId, {
    select: (x) => !!lastReasoningMessageId && !!(x?.is_completed || !!x.final_reasoning_message)
  });
  const { data: hasResponseFile } = useGetChatMessage(lastMessageId, {
    select: (x) => Object.values(x?.response_messages || {}).some((x) => x.type === 'file')
  });

  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const previousIsCompletedStream = useRef<boolean>(isCompletedStream);

  const { data: hasLoadedChat } = useGetChat({ id: chatId || '' }, { select: (x) => !!x.id });

  const { getFileLinkMeta } = useGetFileLink();

  const hasReasoning = !!lastReasoningMessageId;

  useLayoutEffect(() => {
    previousIsCompletedStream.current = isCompletedStream;
  }, [hasLoadedChat]);

  useEffect(() => {
    if (!hasLoadedChat || !chatId) {
      return;
    }

    const chatMessage = getChatMessageMemoized(lastMessageId);
    const firstFileId = chatMessage?.response_message_ids?.find((id) => {
      const responseMessage = chatMessage?.response_messages[id];
      return responseMessage?.type === 'file';
    });

    //this will happen if it is streaming and has a file in the response
    if (!isCompletedStream && firstFileId) {
      const firstFile = chatMessage?.response_messages[firstFileId] as
        | BusterChatResponseMessage_file
        | undefined;

      if (firstFile) {
        const { link } = getFileLinkMeta({
          fileId: firstFile.id,
          fileType: firstFile.file_type,
          chatId,
          versionNumber: firstFile.version_number,
          useVersionHistoryMode: !chatId
        });

        if (link) {
          onChangePage(link);
        }
      }
    }

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    else if (!isCompletedStream && !isFinishedReasoning && hasReasoning && chatId) {
      previousLastMessageId.current = lastMessageId;

      if (!messageId) {
        onSetSelectedFile({ id: lastMessageId, type: 'reasoning', versionNumber: undefined });
      }
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (isCompletedStream && previousIsCompletedStream.current === false && !firstFileId) {
      //no file is found, so we need to collapse the chat
      onChangePage({
        route: BusterRoutes.APP_CHAT_ID,
        chatId
      });
    }
  }, [isCompletedStream, hasReasoning, hasResponseFile, chatId, lastMessageId]); //only use these values to trigger the useEffect
};
