import { useMemo, useRef } from 'react';
import { messageShape, messagesShape } from './shapes';
import { useShape, useShapeStream } from '../instances';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { updateMessageShapeToIChatMessage } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { prefetchGetListChats, useGetChatMemoized } from '@/api/buster_rest/chats';
import uniq from 'lodash/uniq';
import type { ChatMessageResponseMessage_File } from '@buster/server-shared/chats';
import type { BusterChatMessage } from '../../asset_interfaces/chat';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardQueryKeys } from '../../query_keys/dashboard';
import last from 'lodash/last';
import isEmpty from 'lodash/isEmpty';
import { metricsQueryKeys } from '../../query_keys/metric';

export const useGetMessage = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
  const shape = useMemo(() => messageShape({ chatId, messageId }), [chatId, messageId]);
  return useShape(shape);
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messagesShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<'insert' | 'update' | 'delete'> = ['update'];
const insertOperations: Array<'insert' | 'update' | 'delete'> = ['insert'];

export const useTrackAndUpdateMessageChanges = (
  {
    chatId,
    messageId,
    isStreamingMessage
  }: {
    chatId: string | undefined;
    messageId: string;
    isStreamingMessage: boolean;
  },
  callback?: (message: ReturnType<typeof updateMessageShapeToIChatMessage>) => void
) => {
  const { onUpdateChatMessage, onUpdateChat } = useChatUpdate();
  const checkIfWeHaveAFollowupDashboard = useCheckIfWeHaveAFollowupDashboard(messageId);
  const getChatMemoized = useGetChatMemoized();

  const subscribe = !!chatId && !!messageId && messageId !== 'undefined';

  const shape = useMemo(
    () => messageShape({ chatId: chatId || '', messageId }),
    [chatId, messageId]
  );

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((message) => {
      if (message && message.value && chatId) {
        const iChatMessage = updateMessageShapeToIChatMessage(message.value);
        const chat = getChatMemoized(chatId);

        if (chat) {
          //ADD NEW MESSAGE ID TO CHAT
          const currentMessageIds = chat.message_ids;
          const allMessageIds = uniq([...currentMessageIds, messageId]);
          if (currentMessageIds.length !== allMessageIds.length) {
            onUpdateChat({
              ...chat,
              id: chatId,
              message_ids: allMessageIds
            });
          }

          //check if we have a files in the message
          const hasFiles = iChatMessage.reasoning_message_ids?.some((id) => {
            const reasoningMessage = iChatMessage.response_messages?.[id];
            return (
              reasoningMessage &&
              (reasoningMessage as ChatMessageResponseMessage_File)?.file_type === 'dashboard'
            );
          });
          if (hasFiles) {
            prefetchGetListChats();
          }

          if (!isEmpty(iChatMessage.response_message_ids)) {
            checkIfWeHaveAFollowupDashboard(iChatMessage);
          }

          if (iChatMessage.is_completed) {
            prefetchGetListChats();
          }
        }
        callback?.(iChatMessage);
        onUpdateChatMessage(iChatMessage);
      }
    }),
    subscribe
  );
};

const useCheckIfWeHaveAFollowupDashboard = (messageId: string) => {
  const queryClient = useQueryClient();
  const hasSeenFileByMessageId = useRef<Record<string, boolean>>({});

  const method = (message: Partial<BusterChatMessage>) => {
    if (!hasSeenFileByMessageId.current[messageId]) {
      const allFiles = Object.values(message.response_messages || {}).filter(
        (x) => (x as ChatMessageResponseMessage_File).file_type === 'dashboard'
      ) as ChatMessageResponseMessage_File[];
      if (allFiles.length > 0) {
        hasSeenFileByMessageId.current[messageId] = true;

        for (const file of allFiles) {
          const fileType = (file as ChatMessageResponseMessage_File).file_type;
          if (fileType === 'dashboard') {
            const { queryKey } = dashboardQueryKeys.dashboardGetDashboard(
              file.id,
              file.version_number
            );
            queryClient.invalidateQueries({ queryKey });
          } else if (fileType === 'metric') {
            const { queryKey } = metricsQueryKeys.metricsGetMetric(file.id, file.version_number);
            queryClient.invalidateQueries({ queryKey });
          } else {
            const _exhaustiveCheck: 'reasoning' = fileType;
          }
        }
      }
    }
  };

  return useMemoizedFn(method);
};

export const useTrackAndUpdateNewMessages = ({ chatId }: { chatId: string | undefined }) => {
  const { onUpdateChat } = useChatUpdate();
  const getChatMemoized = useGetChatMemoized();

  const subscribe = !!chatId;

  const shape = useMemo(() => messagesShape({ chatId: chatId || '' }), [chatId]);

  return useShapeStream(
    shape,
    insertOperations,
    useMemoizedFn((message) => {
      if (message && message.value && chatId) {
        const messageId = message.value.id;
        const chat = getChatMemoized(chatId);

        if (chat && messageId) {
          const currentMessageIds = chat.message_ids;
          const allMessageIds = uniq([...currentMessageIds, messageId]);
          
          if (currentMessageIds.length !== allMessageIds.length) {
            onUpdateChat({
              ...chat,
              id: chatId,
              message_ids: allMessageIds
            });
          }
        }
      }
    }),
    subscribe
  );
};
