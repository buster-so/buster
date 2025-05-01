'use client';

import { useGetChatMessageMemoized, useGetChatMessage } from '@/api/buster_rest/chats';
import { useEffect, useRef } from 'react';
import findLast from 'lodash/findLast';
import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { usePrevious } from '@/hooks';
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
  const secondaryView = useChatLayoutContextSelector((x) => x.secondaryView);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const { data: isCompletedStream } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.isCompletedStream
  });

  const getInitialChatFileHref = useGetInitialChatFile();

  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const previousLastMessageId = useRef<string | null>(null);
  const { data: reasoningMessagesLength } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.reasoning_message_ids?.length || 0
  });
  const { getFileLinkMeta } = useGetFileLink();

  const previousIsCompletedStream = usePrevious(isCompletedStream);

  const hasReasoning = !!reasoningMessagesLength;

  useEffect(() => {
    console.log('REASONING: useEffect', isCompletedStream, hasReasoning, chatId, lastMessageId);
    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    if (
      !isCompletedStream &&
      hasReasoning &&
      previousLastMessageId.current !== lastMessageId &&
      chatId
    ) {
      previousLastMessageId.current = lastMessageId;

      console.log('REASONING: FLIP TO REASONING!', lastMessageId);

      onSetSelectedFile({ id: lastMessageId, type: 'reasoning', versionNumber: undefined });
    }

    //this will when the chat is completed and it WAS streaming
    else if (isCompletedStream && previousIsCompletedStream === false) {
      console.log('REASONING: SELECT STREAMING FILE');
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
          console.log('auto change layout', link);
          onChangePage(link);
        }
        return;
      }
    }
    //this will trigger on a page refresh and the chat is completed
    else if (isCompletedStream && chatId) {
      console.log('REASONING: SELECT INITIAL CHAT FILE - PAGE LOAD');
      const isChatOnlyMode = !metricId && !dashboardId && !messageId;
      if (isChatOnlyMode) {
        return;
      }

      const href = getInitialChatFileHref({
        metricId,
        dashboardId,
        messageId,
        chatId,
        secondaryView,
        dashboardVersionNumber,
        metricVersionNumber
      });

      if (href) {
        console.log('auto change layout2', href);
        onChangePage(href);
      }
    }
  }, [isCompletedStream, hasReasoning, chatId, lastMessageId]);
};
