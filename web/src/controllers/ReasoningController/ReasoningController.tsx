'use client';

import type { BusterChatMessageReasoning_text } from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessage } from '@/api/buster_rest/chats';
import { queryKeys } from '@/api/query_keys';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useQuery } from '@tanstack/react-query';
import isEmpty from 'lodash/isEmpty';
import last from 'lodash/last';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { BlackBoxMessage } from './ReasoningMessages/ReasoningBlackBoxMessage';
import { ReasoningScrollToBottom } from './ReasoningScrollToBottom';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const { data: hasChat } = useGetChat({ id: chatId || '' }, { select: (x) => !!x.id });
  const { data: reasoningMessageIds } = useGetChatMessage(messageId, {
    select: ({ reasoning_message_ids }) => reasoning_message_ids
  });
  const { data: isCompletedStream } = useGetChatMessage(messageId, {
    select: ({ isCompletedStream }) => isCompletedStream
  });
  const blackBoxMessage = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data']
  }).data;

  const viewportRef = useRef<HTMLDivElement>(null);

  const { isAutoScrollEnabled, scrollToBottom, enableAutoScroll } = useAutoScroll(viewportRef, {
    observeSubTree: true,
    enabled: false
  });

  const { data: reasoningIsCompleted } = useGetChatMessage(messageId, {
    select: (x) =>
      (x?.reasoning_messages[last(reasoningMessageIds) || ''] as BusterChatMessageReasoning_text)
        ?.finished_reasoning
  });

  useEffect(() => {
    if (hasChat && reasoningMessageIds) {
      enableAutoScroll();
    }
  }, [hasChat, isEmpty(reasoningMessageIds)]);

  if (!hasChat || !reasoningMessageIds) return <FileIndeterminateLoader />;

  return (
    <>
      <ScrollArea viewportRef={viewportRef}>
        <div className="h-full flex-col space-y-2 overflow-y-auto p-5">
          {reasoningMessageIds?.map((reasoningMessageId, messageIndex) => (
            <ReasoningMessageSelector
              key={reasoningMessageId}
              reasoningMessageId={reasoningMessageId}
              isCompletedStream={isCompletedStream ?? true}
              chatId={chatId}
              messageId={messageId}
              isLastMessage={messageIndex === reasoningMessageIds.length - 1 && !blackBoxMessage}
            />
          ))}

          {!reasoningIsCompleted && <BlackBoxMessage blackBoxMessage={blackBoxMessage} />}
        </div>
      </ScrollArea>

      <ReasoningScrollToBottom
        isAutoScrollEnabled={isAutoScrollEnabled}
        scrollToBottom={scrollToBottom}
      />
    </>
  );
};
