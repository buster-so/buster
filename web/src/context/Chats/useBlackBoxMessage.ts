'use client';

import { useMemoizedFn, useUnmount } from '@/hooks';
import sample from 'lodash/sample';
import random from 'lodash/random';
import last from 'lodash/last';
import { useRef } from 'react';
import type {
  BusterChatMessageReasoning_text,
  IBusterChatMessage
} from '@/api/asset_interfaces/chat';
import type { ChatEvent_GeneratingReasoningMessage } from '@/api/buster_socket/chats';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';

export const useBlackBoxMessage = () => {
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const queryClient = useQueryClient();

  const clearTimeoutRef = useMemoizedFn((messageId: string) => {
    if (timeoutRef.current[messageId]) {
      clearTimeout(timeoutRef.current[messageId]);
      delete timeoutRef.current[messageId];
    }
  });

  const removeBlackBoxMessage = useMemoizedFn(({ messageId }: { messageId: string }) => {
    clearTimeoutRef(messageId);

    const options = queryKeys.chatsBlackBoxMessages(messageId);
    queryClient.setQueryData(options.queryKey, null);
  });

  const addBlackBoxMessage = useMemoizedFn(({ messageId }: { messageId: string }) => {
    const randomThought = getRandomThought();
    const options = queryKeys.chatsBlackBoxMessages(messageId);
    queryClient.setQueryData(options.queryKey, randomThought);
  });

  const checkBlackBoxMessage = useMemoizedFn(
    (message: IBusterChatMessage, event: ChatEvent_GeneratingReasoningMessage) => {
      const isFinishedReasoningMessage = event.reasoning.status !== 'loading';
      const isFinishedReasoningLoop = (event.reasoning as BusterChatMessageReasoning_text)
        .finished_reasoning;

      if (isFinishedReasoningMessage && !isFinishedReasoningLoop) {
        clearTimeoutRef(message.id);
        addBlackBoxMessage({ messageId: message.id });
        _loopAutoThought({ messageId: message.id });
      } else {
        removeBlackBoxMessage({ messageId: message.id });
      }
    }
  );

  const _loopAutoThought = useMemoizedFn(async ({ messageId }: { messageId: string }) => {
    const randomDelay = random(7000, 7000);
    timeoutRef.current[messageId] = setTimeout(() => {
      const message = getChatMessageMemoized(messageId);
      if (!message) return;
      if (!timeoutRef.current[messageId]) return;

      const isMessageCompletedStream = !!message?.isCompletedStream;
      const lastReasoningMessageId = last(message?.reasoning_message_ids) || '';
      const lastReasoningMessage = message?.reasoning_messages[lastReasoningMessageId];
      const isLastReasoningMessageCompleted = lastReasoningMessage?.status === 'completed';

      if (!isMessageCompletedStream && isLastReasoningMessageCompleted) {
        addBlackBoxMessage({ messageId });
        _loopAutoThought({ messageId });
      }
    }, randomDelay);
  });

  useUnmount(() => {
    Object.values(timeoutRef.current).forEach((timeout) => {
      clearTimeout(timeout);
    });
  });

  return { checkBlackBoxMessage, removeBlackBoxMessage };
};

const getRandomThought = (currentThought?: string): string => {
  const thoughts = currentThought
    ? DEFAULT_THOUGHTS.filter((t) => t !== currentThought)
    : DEFAULT_THOUGHTS;
  return sample(thoughts) ?? DEFAULT_THOUGHTS[0];
};

const DEFAULT_THOUGHTS = [
  'Thinking through next steps...',
  'Looking through context...',
  'Reflecting on the instructions...',
  'Analyzing available actions',
  'Reviewing the objective...',
  'Deciding feasible options...',
  'Sorting out some details...',
  'Exploring other possibilities...',
  'Confirming things....',
  'Mapping information across files...',
  'Making a few edits...',
  'Filling out arguments...',
  'Double-checking the logic...',
  'Validating my approach...',
  'Looking at a few edge cases...',
  'Ensuring everything aligns...',
  'Polishing the details...',
  'Making some adjustments...',
  'Writing out arguments...',
  'Mapping trends and patterns...',
  'Re-evaluating this step...',
  'Updating parameters...',
  'Evaluating available data...',
  'Reviewing all parameters...',
  'Processing relevant info...',
  'Aligning with user request...',
  'Gathering necessary details...',
  'Sorting through options...',
  'Editing my system logic...',
  'Cross-checking references...',
  'Validating my approach...',
  'Rewriting operational details...',
  'Mapping new information...',
  'Adjusting priorities & approach...',
  'Revisiting earlier inputs...',
  'Finalizing plan details...'
];
