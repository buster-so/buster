import { useNavigate } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useIsVersionChanged } from '@/context/AppVersion/useAppVersion';
import { useHasLoadedChat } from '@/context/Chats/useGetChat';
import {
  useGetChatMessageCompleted,
  useGetChatMessageHasResponseFile,
  useGetChatMessageIsFinishedReasoning,
  useGetChatMessageLastReasoningMessageId,
} from '@/context/Chats/useGetChatMessage';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

export const useAutoRedirectStreaming = ({
  lastMessageId,
  chatId,
}: {
  lastMessageId: string;
  chatId: string | undefined;
}) => {
  const navigate = useNavigate();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const versionChanged = useIsVersionChanged();
  const isStreamFinished = useGetChatMessageCompleted({ messageId: lastMessageId });
  const lastReasoningMessageId = useGetChatMessageLastReasoningMessageId({
    messageId: lastMessageId,
  });
  const isFinishedReasoning = useGetChatMessageIsFinishedReasoning({ messageId: lastMessageId });
  const hasResponseFile = useGetChatMessageHasResponseFile({ messageId: lastMessageId });
  const previousIsCompletedStream = useRef<boolean>(isStreamFinished);
  const hasLoadedChat = useHasLoadedChat({ chatId: chatId || '' });
  const hasReasoning = !!lastReasoningMessageId;
  const [triggerAutoNavigate, setTriggerAutoNavigate] = useState<number>(0);

  useLayoutEffect(() => {
    previousIsCompletedStream.current = isStreamFinished;
  }, [hasLoadedChat]);

  //streaming logic to redirect
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
    // or if the chat is completed and has a file in the response
    if (
      (!isStreamFinished && firstFileId) ||
      (isStreamFinished && firstFileId && previousIsCompletedStream.current === false)
    ) {
      const firstFile = chatMessage?.response_messages[firstFileId] as
        | BusterChatResponseMessage_file
        | undefined;

      if (firstFile) {
        const linkProps = assetParamsToRoute({
          assetId: firstFile.id,
          assetType: firstFile.file_type,
          chatId,
          versionNumber: firstFile.version_number,
        });

        navigate({ ...linkProps, replace: true, reloadDocument: versionChanged });
      }

      previousIsCompletedStream.current = true;
    }

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    else if (!isStreamFinished && !isFinishedReasoning && hasReasoning && chatId) {
      navigate({
        to: '/app/chats/$chatId/reasoning/$messageId',
        params: {
          chatId,
          messageId: lastMessageId,
        },
        replace: true,
        reloadDocument: versionChanged,
      });
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (
      isFinishedReasoning &&
      isStreamFinished &&
      previousIsCompletedStream.current === false &&
      !firstFileId
    ) {
      navigate({
        to: '/app/chats/$chatId',
        params: {
          chatId,
        },
        replace: true,
        reloadDocument: versionChanged,
      });
      previousIsCompletedStream.current = true;
    }
  }, [
    isStreamFinished,
    hasReasoning,
    hasResponseFile,
    chatId,
    lastMessageId,
    isFinishedReasoning,
    triggerAutoNavigate,
  ]); //only use these values to trigger the useEffect

  useEffect(() => {
    if (!isStreamFinished && versionChanged) {
      window.location.reload();
    }
  }, [isStreamFinished, versionChanged]);

  useWindowFocus(() => {
    if (isStreamFinished && previousIsCompletedStream.current === false) {
      setTriggerAutoNavigate((prev) => prev + 1);
    }
  });
};
