import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';
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
  const isStreamFinished = useGetChatMessageCompleted({ messageId: lastMessageId });
  const lastReasoningMessageId = useGetChatMessageLastReasoningMessageId({
    messageId: lastMessageId,
  });
  const isFinishedReasoning = useGetChatMessageIsFinishedReasoning({ messageId: lastMessageId });
  const hasResponseFile = useGetChatMessageHasResponseFile({ messageId: lastMessageId });

  const previousIsCompletedStream = useRef<boolean>(isStreamFinished);
  const forceNavigationCheck = useRef<boolean>(false);

  const hasLoadedChat = useHasLoadedChat({ chatId: chatId || '' });

  const hasReasoning = !!lastReasoningMessageId;

  useLayoutEffect(() => {
    previousIsCompletedStream.current = isStreamFinished;
  }, [hasLoadedChat]);

  useWindowFocus(() => {
    if (hasLoadedChat && chatId) {
      forceNavigationCheck.current = true;
    }
  });

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
    if (!isStreamFinished && firstFileId) {
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

        navigate({ ...linkProps, replace: true });
      }
    }

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    else if (!isStreamFinished && !isFinishedReasoning && hasReasoning && chatId) {
      navigate({
        to: '/app/chats/$chatId/reasoning/$messageId',
        params: {
          chatId: chatId,
          messageId: lastMessageId,
        },
        replace: true,
      });
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (
      isFinishedReasoning &&
      isStreamFinished &&
      (previousIsCompletedStream.current === false || forceNavigationCheck.current) &&
      !firstFileId
    ) {
      //no file is found, so we need to collapse the chat

      navigate({
        to: '/app/chats/$chatId',
        params: {
          chatId: chatId,
        },
        replace: true,
      });
      
      forceNavigationCheck.current = false;
    }
  }, [isStreamFinished, hasReasoning, hasResponseFile, chatId, lastMessageId, isFinishedReasoning, forceNavigationCheck.current]); //only use these values to trigger the useEffect
};
