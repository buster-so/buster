import type { ChatMessageResponseMessage_File } from '@buster/server-shared/chats';
import { useQueryClient } from '@tanstack/react-query';
import isEmpty from 'lodash/isEmpty';
import uniq from 'lodash/uniq';
import { useMemo, useRef } from 'react';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useUnmount } from '@/hooks/useUnmount';
import type { BusterChatMessage } from '../../asset_interfaces/chat';
import { useChatUpdate } from '../../buster_rest/chats/useChatUpdate';
import { chatQueryKeys } from '../../query_keys/chat';
import { dashboardQueryKeys } from '../../query_keys/dashboard';
import { metricsQueryKeys } from '../../query_keys/metric';
import { DEFAULT_UPDATE_OPERATIONS } from '../config';
import { useShape, useShapeStream } from '../instances';
import { updateMessageShapeToIChatMessage } from './helpers';
import { messageShape, messagesShape } from './shapes';

export const useGetMessage = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
  const shape = useMemo(() => messageShape({ chatId, messageId }), [chatId, messageId]);
  return useShape(shape);
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messagesShape({ chatId }), [chatId]);
  return useShape(shape);
};

const insertOperations: Array<'insert' | 'update' | 'delete'> = ['insert'];

export const useTrackAndUpdateMessageChanges = (
  {
    chatId,
    messageId,
    isStreamingMessage,
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
  const queryClient = useQueryClient();

  const subscribe = !!chatId && !!messageId && messageId !== 'undefined' && isStreamingMessage;

  const shape = useMemo(() => {
    return messageShape({ chatId: chatId || '', messageId });
  }, [chatId, messageId]);

  return useShapeStream(
    shape,
    DEFAULT_UPDATE_OPERATIONS,
    (message) => {
      if (message?.value && chatId) {
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
              message_ids: allMessageIds,
            });
          }

          if (!isEmpty(iChatMessage.response_message_ids)) {
            checkIfWeHaveAFollowupDashboard(iChatMessage);
          }

          if (iChatMessage.is_completed) {
            queryClient.invalidateQueries({
              queryKey: chatQueryKeys.chatsGetList().queryKey,
            });
            const hasFiles = iChatMessage.reasoning_message_ids?.some((id) => {
              const reasoningMessage = iChatMessage.response_messages?.[id];
              return (
                reasoningMessage &&
                (reasoningMessage as ChatMessageResponseMessage_File)?.file_type ===
                  'dashboard_file'
              );
            });
            if (hasFiles) {
              queryClient
                .invalidateQueries({
                  queryKey: metricsQueryKeys.metricsGetList().queryKey,
                })
                .then(() => {
                  queryClient.invalidateQueries({
                    queryKey: reportsQueryKeys.reportsGetList().queryKey,
                  });
                });
            }
          }
        }
        callback?.(iChatMessage);
        onUpdateChatMessage(iChatMessage);
      }
    },
    subscribe
  );
};

const useCheckIfWeHaveAFollowupDashboard = (messageId: string) => {
  const queryClient = useQueryClient();
  const hasSeenFileByMessageId = useRef<Record<string, boolean>>({});

  const method = (message: Partial<BusterChatMessage>) => {
    if (!hasSeenFileByMessageId.current[messageId]) {
      const allFiles = Object.values(message.response_messages || {}).filter(
        (x) => (x as ChatMessageResponseMessage_File).file_type === 'dashboard_file'
      ) as ChatMessageResponseMessage_File[];
      if (allFiles.length > 0) {
        hasSeenFileByMessageId.current[messageId] = true;

        for (const file of allFiles) {
          const fileType = (file as ChatMessageResponseMessage_File).file_type;
          if (fileType === 'dashboard_file') {
            const queryKey = dashboardQueryKeys
              .dashboardGetDashboard(file.id, file.version_number)
              .queryKey.slice(0, 3);
            queryClient.invalidateQueries({
              exact: false,
              queryKey,
            });
          } else if (fileType === 'metric_file') {
            const queryKey = metricsQueryKeys
              .metricsGetMetric(file.id, file.version_number)
              .queryKey.slice(0, 3);
            queryClient.invalidateQueries({
              exact: false,
              queryKey,
            });
          } else if (fileType === 'report_file') {
            const queryKey = reportsQueryKeys
              .reportsGetReport(file.id, file.version_number)
              .queryKey.slice(0, 3);
            queryClient.invalidateQueries({
              exact: false,
              queryKey,
            });
          } else {
            const _exhaustiveCheck: 'reasoning' = fileType;
          }
        }
      }
    }
  };

  return useMemoizedFn(method);
};

export const useTrackAndUpdateNewMessages = ({
  chatId,
  isEmbed,
}: {
  chatId: string | undefined;
  isEmbed: boolean;
}) => {
  const { onUpdateChat } = useChatUpdate();
  const getChatMemoized = useGetChatMemoized();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const queryClient = useQueryClient();

  const subscribe = !!chatId && !isEmbed;

  const shape = useMemo(() => {
    return messagesShape({ chatId: chatId || '', columns: ['id'] });
  }, [chatId]);

  return useShapeStream(
    shape,
    insertOperations,
    (message) => {
      if (message?.value && chatId) {
        const messageId = message.value.id;
        const chat = getChatMemoized(chatId);

        if (chat && messageId) {
          const currentMessageIds = chat.message_ids;
          const allMessageIds = uniq([...currentMessageIds, messageId]);

          if (currentMessageIds.length !== allMessageIds.length) {
            onUpdateChat({
              ...chat,
              id: chatId,
              message_ids: allMessageIds,
            });

            const messageIsStored = getChatMessageMemoized(messageId);
            if (!messageIsStored) {
              queryClient.invalidateQueries({
                queryKey: chatQueryKeys.chatsGetChat(chatId).queryKey,
              });
            }
          }
        }
      }
    },
    subscribe
  );
};
