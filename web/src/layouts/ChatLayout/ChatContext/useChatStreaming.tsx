import type {
  BusterChat,
  BusterChatMessage,
  IBusterChat,
  IBusterChatMessage
} from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useBlackBoxMessage } from './useBlackBoxMessage';
import { updateChatToIChat } from '@/lib/chat';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchGetMetricDataClient } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useTrackAndUpdateMessageChanges } from '@/api/buster-electric/messages';
import { useTrackAndUpdateChatChanges } from '@/api/buster-electric/chats';

export const useChatStreaming = ({
  chatId,
  messageId = ''
}: {
  chatId: string | undefined;
  messageId: string | undefined;
}) => {
  const { checkBlackBoxMessage, removeBlackBoxMessage } = useBlackBoxMessage();
  const queryClient = useQueryClient();

  const _prefetchLastMessageMetricData = useMemoizedFn(
    (iChat: IBusterChat, iChatMessages: Record<string, IBusterChatMessage>) => {
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
    (
      d: Pick<
        BusterChatMessage,
        'id' | 'reasoning_messages' | 'reasoning_message_ids' | 'is_completed'
      >
    ) => {
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
      //
    }
  );

  const completeChat = useMemoizedFn((d: BusterChat) => {
    const { iChat, iChatMessages } = updateChatToIChat(d, false);
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
  useTrackAndUpdateChatChanges({ chatId });
  useTrackAndUpdateMessageChanges({ chatId, messageId }, (c) => {
    const {
      reasoning_messages,
      reasoning_message_ids,
      id,
      is_completed = false,
      response_messages,
      response_message_ids
    } = c;

    if (reasoning_messages && reasoning_message_ids) {
      onUpdateReasoningMessageFromStream({
        reasoning_messages,
        reasoning_message_ids,
        is_completed,
        id
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

  return {
    completeChat,
    onUpdateReasoningMessageFromStream,
    onUpdateResponseMessageFromStream
  };
};
