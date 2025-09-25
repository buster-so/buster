import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { BusterChat, BusterChatMessage, IBusterChat } from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { prefetchGetMetricDataClient } from '@/api/buster_rest/metrics';
import { useTrackAndUpdateChatChanges } from '@/api/buster-electric/chats';
import {
  useTrackAndUpdateMessageChanges,
  useTrackAndUpdateNewMessages,
} from '@/api/buster-electric/messages';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useBlackboxMessage } from '@/context/BlackBox/useBlackboxMessage';
import { updateDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { updateChatToIChat } from '@/lib/chat';

const stableChatTitleSelector = (chat: IBusterChat) => chat.title;
export const useChatStreaming = ({
  chatId,
  isStreamingMessage,
  messageId = '',
}: {
  chatId: string | undefined;
  messageId: string | undefined;
  isStreamingMessage: boolean;
}) => {
  const { checkBlackBoxMessage, removeBlackBoxMessage } = useBlackboxMessage();
  const queryClient = useQueryClient();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const { data: chatTitle } = useGetChat(
    { id: chatId || '' },
    { select: stableChatTitleSelector, notifyOnChangeProps: ['data'] }
  );

  const _prefetchLastMessageMetricData = (
    iChat: IBusterChat,
    iChatMessages: Record<string, BusterChatMessage>
  ) => {
    const lastMessageId = iChat.message_ids[iChat.message_ids.length - 1];
    const lastMessage = iChatMessages[lastMessageId];
    if (lastMessage?.response_message_ids) {
      for (const responseMessage of Object.values(lastMessage.response_messages)) {
        if (responseMessage.type === 'file' && responseMessage.file_type === 'metric_file') {
          prefetchGetMetricDataClient(
            { id: responseMessage.id, version_number: responseMessage.version_number },
            queryClient
          );
          const queryKey = metricsQueryKeys
            .metricsGetMetric(responseMessage.id, 'LATEST')
            .queryKey.slice(0, 3);
          queryClient.invalidateQueries({
            queryKey,
            exact: false,
            refetchType: 'all',
          });
        }
      }
    }
  };

  const onUpdateReasoningMessageFromStream = useMemoizedFn(
    (d: Parameters<typeof checkBlackBoxMessage>[0]) => {
      checkBlackBoxMessage(d);
    }
  );

  const onUpdateResponseMessageFromStream = useMemoizedFn(
    (
      d: Pick<
        BusterChatMessage,
        'id' | 'response_messages' | 'is_completed' | 'response_message_ids'
      >
    ) => {
      const lastResponseMessageId = d.response_message_ids[d.response_message_ids.length - 1];
      const lastResponseMessage = d.response_messages[lastResponseMessageId];
      if (
        lastResponseMessage?.type === 'file' &&
        lastResponseMessage?.file_type === 'metric_file'
      ) {
        prefetchGetMetricDataClient(
          { id: lastResponseMessage.id, version_number: lastResponseMessage.version_number },
          queryClient
        );
      }
    }
  );

  const completeChat = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d);
    removeBlackBoxMessage(iChat.message_ids[iChat.message_ids.length - 1]);
    _prefetchLastMessageMetricData(iChat, iChatMessages);
    // _normalizeChatMessage(iChatMessages);
    //  onUpdateChat(iChat);

    const refreshKeys = [
      chatQueryKeys.chatsGetList().queryKey,
      metricsQueryKeys.metricsGetList().queryKey,
    ];
    for (const key of refreshKeys) {
      queryClient.invalidateQueries({
        queryKey: key,
        refetchType: 'all',
      });
    }
  });

  //HOOKS FOR TRACKING CHAT AND MESSAGE CHANGES
  useTrackAndUpdateChatChanges({ chatId, isStreamingMessage });
  useTrackAndUpdateNewMessages({ chatId });
  useTrackAndUpdateMessageChanges({ chatId, messageId, isStreamingMessage }, (c) => {
    const {
      reasoning_messages,
      reasoning_message_ids,
      id,
      is_completed = false,
      response_messages,
      response_message_ids,
      final_reasoning_message = null,
    } = c;

    if (reasoning_messages && reasoning_message_ids) {
      onUpdateReasoningMessageFromStream({
        reasoning_messages,
        reasoning_message_ids,
        is_completed,
        id,
        final_reasoning_message,
      });
    }

    if (response_messages && response_message_ids) {
      onUpdateResponseMessageFromStream({
        id,
        is_completed,
        response_messages,
        response_message_ids,
      });
    }
  });

  useEffect(() => {
    if (isStreamingMessage) {
      const message = getChatMessageMemoized(messageId);
      if (message) {
        checkBlackBoxMessage(message);
      }
    } else {
      removeBlackBoxMessage(messageId);
    }
  }, [isStreamingMessage]);

  return {
    completeChat,
    onUpdateReasoningMessageFromStream,
    onUpdateResponseMessageFromStream,
  };
};
