import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useQueries } from '@tanstack/react-query';

export const useReasoningIsCompleted = (messageId: string) => {
  const queryKey = chatQueryKeys.chatsMessages(messageId);
  const reasoningIsCompleted = useQueries({
    queries: [
      {
        ...queryKey,
        enabled: false,
        select: (x: BusterChatMessage | undefined) => ({
          is_completed: x?.is_completed,
          final_reasoning_message: x?.final_reasoning_message
        })
      }
    ],
    combine: (result) => {
      const { data } = result[0];
      return data?.final_reasoning_message || data?.is_completed;
    }
  });

  return reasoningIsCompleted;
};
