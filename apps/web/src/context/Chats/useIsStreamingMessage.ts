import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useGetActiveChat } from './useGetActiveChat';

const stableIsCompleted = (data: BusterChatMessage | undefined) => data?.is_completed;
export const useIsStreamingMessage = () => {
  const chat = useGetActiveChat();
  const chatMessageIds = chat?.message_ids ?? [];
  const stableQueries = useMemo(() => {
    return chatMessageIds.map((messageId) => {
      const queryKey = chatQueryKeys.chatsMessages(messageId);
      return {
        ...queryKey,
        enabled: false,
        select: stableIsCompleted,
      };
    });
  }, [chatMessageIds]);

  const isStreamingMessage = useQueries({
    queries: stableQueries,
    combine: useCallback(
      (result: { data: boolean | undefined }[]) => {
        return result.some((res) => res.data === false);
      },
      [stableQueries]
    ),
  });

  return isStreamingMessage;
};
