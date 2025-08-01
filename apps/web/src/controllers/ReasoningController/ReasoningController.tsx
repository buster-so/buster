'use client';

import { useQuery } from '@tanstack/react-query';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useGetChat, useGetChatMessage } from '@/api/buster_rest/chats';
import { queryKeys } from '@/api/query_keys';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { BlackBoxMessage } from './ReasoningMessages/ReasoningBlackBoxMessage';
import { ReasoningScrollToBottom } from './ReasoningScrollToBottom';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const { data: hasChat } = useGetChat({ id: chatId || '' }, { select: (x) => !!x.id });
  const { data: reasoning_message_ids = [] } = useGetChatMessage(messageId, {
    select: ({ reasoning_message_ids }) => reasoning_message_ids
  });
  const reasoningMessageIds = useMemo(() => reasoning_message_ids, [reasoning_message_ids]);
  const { data: isStreamFinished } = useGetChatMessage(messageId, {
    select: ({ is_completed }) => is_completed
  });
  const { data: finalReasoningMessage } = useGetChatMessage(messageId, {
    select: ({ final_reasoning_message }) => final_reasoning_message
  });
  const { data: blackBoxMessage } = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data']
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  const { isAutoScrollEnabled, scrollToBottom, enableAutoScroll } = useAutoScroll(viewportRef, {
    observeSubTree: true,
    enabled: !!viewportRef.current
  });

  useEffect(() => {
    if (hasChat && reasoningMessageIds) {
      enableAutoScroll();
    }
  }, [hasChat, isEmpty(reasoningMessageIds)]);

  if (!hasChat || !reasoningMessageIds) return <FileIndeterminateLoader />;

  return (
    <>
      <ScrollArea viewportRef={viewportRef} className="swag h-full">
        <div className="h-full flex-col space-y-0.5 overflow-y-auto p-5">
          {reasoningMessageIds?.map((reasoningMessageId, messageIndex) => (
            <ReasoningMessageSelector
              key={reasoningMessageId}
              reasoningMessageId={reasoningMessageId}
              isStreamFinished={isStreamFinished ?? true}
              chatId={chatId}
              messageId={messageId}
              isLastMessage={messageIndex === reasoningMessageIds.length - 1 && !blackBoxMessage}
            />
          ))}

          <BlackBoxMessage
            blackBoxMessage={blackBoxMessage}
            finalReasoningMessage={finalReasoningMessage}
            isStreamFinished={isStreamFinished ?? true}
          />
        </div>
      </ScrollArea>

      <ReasoningScrollToBottom
        isAutoScrollEnabled={isAutoScrollEnabled}
        scrollToBottom={scrollToBottom}
      />
    </>
  );
};
