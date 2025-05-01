'use client';

import React, { useMemo } from 'react';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useMemoizedFn } from '@/hooks';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Text } from '@/components/ui/typography';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay: 0.125 }
};

export const ChatResponseReasoning: React.FC<{
  reasoningMessageId: string | undefined;
  finalReasoningMessage: string | undefined | null;
  isCompletedStream: boolean;
  messageId: string;
  chatId: string;
}> = React.memo(({ reasoningMessageId, isCompletedStream, messageId, chatId }) => {
  const { data: lastMessageTitle } = useGetChatMessage(messageId, {
    select: (x) => x?.reasoning_messages?.[reasoningMessageId ?? '']?.title
  });
  const { data: finalReasoningMessage } = useGetChatMessage(messageId, {
    select: (x) => x?.final_reasoning_message
  });
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const isReasonginFileSelected = selectedFileType === 'reasoning';
  const showShimmerText = isReasonginFileSelected ? false : !isCompletedStream;

  const blackBoxMessage = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data']
  }).data;

  const text: string = useMemo(() => {
    if (finalReasoningMessage) return finalReasoningMessage;
    if (blackBoxMessage) return blackBoxMessage;
    if (lastMessageTitle) return lastMessageTitle;
    return lastMessageTitle || 'Thinking...';
  }, [lastMessageTitle, finalReasoningMessage, blackBoxMessage]);

  const href = useMemo(() => {
    if (!messageId) return '';

    if (isReasonginFileSelected) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID,
        chatId
      });
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      messageId,
      chatId
    });
  }, [isReasonginFileSelected, messageId, chatId]);

  return (
    <Link href={href} prefetch aria-label="Reasoning link">
      <AnimatePresence initial={!isCompletedStream} mode="wait">
        <motion.div
          {...animations}
          key={text}
          className="flex h-[14px] max-h-[14px] w-fit cursor-pointer items-center">
          {!showShimmerText ? (
            <Text variant={'secondary'} className="hover:text-text-default hover:underline">
              {text}
            </Text>
          ) : (
            <ShimmerText text={text ?? ''} />
          )}
        </motion.div>
      </AnimatePresence>
    </Link>
  );
});

ChatResponseReasoning.displayName = 'ChatThoughts';
