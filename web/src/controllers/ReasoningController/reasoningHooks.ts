import type {
  BusterChatMessageReasoning_text,
  BusterChatMessage
} from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useQueries } from '@tanstack/react-query';
import last from 'lodash/last';

export const useReasoningIsCompleted = (messageId: string, reasoningMessageIds: string[]) => {
  const queryKey = chatQueryKeys.chatsMessages(messageId);
  const reasoningIsCompleted = useQueries({
    queries: [
      {
        ...queryKey,
        enabled: false,
        select: (x: BusterChatMessage | undefined) => ({
          finished_reasoning: (
            x?.reasoning_messages[
              last(reasoningMessageIds) || ''
            ] as BusterChatMessageReasoning_text
          )?.finished_reasoning,
          final_reasoning_message: x?.final_reasoning_message
        })
      }
    ],
    combine: (result) => {
      const { data } = result[0];
      return data?.final_reasoning_message || data?.finished_reasoning;
    }
  });

  return reasoningIsCompleted;
};
