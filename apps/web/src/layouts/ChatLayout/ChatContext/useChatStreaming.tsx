import type { BusterChat, IBusterChat, BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useBlackBoxMessage } from './useBlackBoxMessage';
import { updateChatToIChat } from '@/lib/chat';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchGetMetricDataClient } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useTrackAndUpdateMessageChanges } from '@/api/buster-electric/messages';
import { useTrackAndUpdateChatChanges } from '@/api/buster-electric/chats';
import { useEffect } from 'react';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';

export const useChatStreaming = ({
  chatId,
  isStreamingMessage,
  messageId = ''
}: {
  chatId: string | undefined;
  messageId: string | undefined;
  isStreamingMessage: boolean;
}) => {
  const { checkBlackBoxMessage, removeBlackBoxMessage } = useBlackBoxMessage();
  const queryClient = useQueryClient();
  const getChatMessageMemoized = useGetChatMessageMemoized();

  const _prefetchLastMessageMetricData = useMemoizedFn(
    (iChat: IBusterChat, iChatMessages: Record<string, BusterChatMessage>) => {
      const lastMessageId = iChat.message_ids[iChat.message_ids.length - 1];
      const lastMessage = iChatMessages[lastMessageId];
      if (lastMessage?.response_message_ids) {
        for (const responseMessage of Object.values(lastMessage.response_messages)) {
          if (responseMessage.type === 'file' && responseMessage.file_type === 'metric') {
            prefetchGetMetricDataClient(
              { id: responseMessage.id, version_number: responseMessage.version_number },
              queryClient
            );
            const options = queryKeys.metricsGetMetric(
              responseMessage.id,
              responseMessage.version_number
            );
            queryClient.invalidateQueries({
              queryKey: options.queryKey,
              refetchType: 'all'
            });
          }
        }
      }
    }
  );

  const onUpdateReasoningMessageFromStream = useMemoizedFn(
    (d: Parameters<typeof checkBlackBoxMessage>[0]) => {
      console.log('onUpdateReasoningMessageFromStream', d);
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
      if (lastResponseMessage?.type === 'file' && lastResponseMessage?.file_type === 'metric') {
        prefetchGetMetricDataClient(
          { id: lastResponseMessage.id, version_number: lastResponseMessage.version_number },
          queryClient
        );
      }
    }
  );

  const completeChat = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d);
    removeBlackBoxMessage({ messageId: iChat.message_ids[iChat.message_ids.length - 1] });
    _prefetchLastMessageMetricData(iChat, iChatMessages);
    // _normalizeChatMessage(iChatMessages);
    //  onUpdateChat(iChat);

    const refreshKeys = [queryKeys.chatsGetList().queryKey, queryKeys.metricsGetList().queryKey];
    for (const key of refreshKeys) {
      queryClient.invalidateQueries({
        queryKey: key,
        refetchType: 'all'
      });
    }
  });

  //HOOKS FOR TRACKING CHAT AND MESSAGE CHANGES
  useTrackAndUpdateChatChanges({ chatId, isStreamingMessage });
  useTrackAndUpdateMessageChanges({ chatId, messageId, isStreamingMessage }, (c) => {
    const {
      reasoning_messages,
      reasoning_message_ids,
      id,
      is_completed = false,
      response_messages,
      response_message_ids,
      final_reasoning_message = null
    } = c;

    if (reasoning_messages && reasoning_message_ids) {
      onUpdateReasoningMessageFromStream({
        reasoning_messages,
        reasoning_message_ids,
        is_completed,
        id,
        final_reasoning_message
      });
    }

    if (response_messages && response_message_ids) {
      onUpdateResponseMessageFromStream({
        id,
        is_completed,
        response_messages,
        response_message_ids
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
      removeBlackBoxMessage({ messageId });
    }
  }, [isStreamingMessage]);

  return {
    completeChat,
    onUpdateReasoningMessageFromStream,
    onUpdateResponseMessageFromStream
  };
};
