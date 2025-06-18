'use client';

import findLast from 'lodash/findLast';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type {
  BusterChatMessageReasoning_text,
  BusterChatResponseMessage_file
} from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessage, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { usePrevious } from '@/hooks';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { useGetInitialChatFile } from './useGetInitialChatFile';

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
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const currentRoute = useChatLayoutContextSelector((x) => x.currentRoute);
  const { data: isCompletedStream = false } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.is_completed
  });

  const getInitialChatFileHref = useGetInitialChatFile();

  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const previousIsCompletedStream = useRef<boolean>(isCompletedStream);

  const { data: hasLoadedChat } = useGetChat({ id: chatId || '' }, { select: (x) => !!x.id });
  const { data: lastReasoningMessageId } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.reasoning_message_ids?.[x?.reasoning_message_ids?.length - 1]
  });
  const { data: isFinishedReasoning } = useGetChatMessage(lastMessageId, {
    select: (x) => !!lastReasoningMessageId && !!(x?.is_completed || !!x.final_reasoning_message)
  });
  const { getFileLinkMeta } = useGetFileLink();

  const hasReasoning = !!lastReasoningMessageId;

  useLayoutEffect(() => {
    if (hasLoadedChat) {
      previousLastMessageId.current = lastMessageId;
    }
  }, [hasLoadedChat]);

  useEffect(() => {
    if (!hasLoadedChat || !chatId) {
      return;
    }

    previousIsCompletedStream.current = isCompletedStream;

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    if (
      !isCompletedStream &&
      !isFinishedReasoning &&
      hasReasoning &&
      previousLastMessageId.current !== lastMessageId &&
      chatId
    ) {
      console.log('triggering auto change layout to open reasoning');
      previousLastMessageId.current = lastMessageId;

      onSetSelectedFile({ id: lastMessageId, type: 'reasoning', versionNumber: undefined });
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (isCompletedStream && previousIsCompletedStream.current === false) {
      console.log('triggering auto change layout to open file');
      const chatMessage = getChatMessageMemoized(lastMessageId);
      const lastFileId = findLast(chatMessage?.response_message_ids, (id) => {
        const responseMessage = chatMessage?.response_messages[id];
        return responseMessage?.type === 'file';
      });
      const lastFile = chatMessage?.response_messages[lastFileId || ''] as
        | BusterChatResponseMessage_file
        | undefined;

      if (lastFileId && lastFile) {
        const { link } = getFileLinkMeta({
          fileId: lastFileId,
          fileType: lastFile.file_type,
          chatId,
          versionNumber: lastFile.version_number,
          useVersionHistoryMode: !chatId
        });

        if (link) {
          onChangePage(link);
        }
        return;
      }
    }
    //this will trigger on a page refresh and the chat is completed
    else if (isCompletedStream && chatId) {
      console.log('triggering auto change layout to open file');
      const isChatOnlyMode = !metricId && !dashboardId && !messageId;
      if (isChatOnlyMode) {
        return;
      }

      const href = getInitialChatFileHref({
        metricId,
        dashboardId,
        messageId,
        chatId,
        dashboardVersionNumber,
        metricVersionNumber,
        currentRoute
      });

      if (href) {
        onChangePage(href);
      }
    }
  }, [isCompletedStream, hasReasoning, chatId, lastMessageId]); //only use these values to trigger the useEffect
};
