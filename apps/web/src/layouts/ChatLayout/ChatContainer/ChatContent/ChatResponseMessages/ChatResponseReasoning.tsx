'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { queryKeys } from '@/api/query_keys';
import { Text } from '@/components/ui/typography';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { BLACK_BOX_INITIAL_THOUGHT } from '@/layouts/ChatLayout/ChatContext/useBlackBoxMessage';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay: 0, duration: 0.35 }
};

export const ChatResponseReasoning: React.FC<{
  reasoningMessageId: string | undefined;
  finalReasoningMessage: string | undefined | null;
  isStreamFinished: boolean;
  messageId: string;
  chatId: string;
}> = React.memo(
  ({ finalReasoningMessage, reasoningMessageId, isStreamFinished, messageId, chatId }) => {
    const urlMessageId = useChatLayoutContextSelector((x) => x.messageId);
    const { data: lastMessageTitle } = useGetChatMessage(messageId, {
      select: (x) => x?.reasoning_messages?.[reasoningMessageId ?? '']?.title
    });
    const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
    const isReasonginFileSelected = selectedFileType === 'reasoning' && urlMessageId === messageId;
    const showShimmerText = isReasonginFileSelected
      ? !finalReasoningMessage
      : !isStreamFinished && !finalReasoningMessage;

    const blackBoxMessage = useQuery({
      ...queryKeys.chatsBlackBoxMessages(messageId),
      notifyOnChangeProps: ['data']
    }).data;

    const text: string = useMemo(() => {
      if (finalReasoningMessage) return finalReasoningMessage;
      if (blackBoxMessage) return blackBoxMessage;
      if (lastMessageTitle) return lastMessageTitle;
      return lastMessageTitle || BLACK_BOX_INITIAL_THOUGHT;
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
      <Link href={href} prefetch aria-label="Reasoning link" className="mt-0.5 leading-1.5">
        <AnimatePresence initial={!isStreamFinished} mode="wait">
          <motion.div
            {...animations}
            key={text}
            className="flex h-[14px] max-h-[14px] w-fit cursor-pointer items-center">
            {!showShimmerText ? (
              <Text
                variant={isReasonginFileSelected ? 'default' : 'secondary'}
                className="hover:text-text-default hover:underline">
                {text}
              </Text>
            ) : (
              <ShimmerText text={text ?? ''} />
            )}
          </motion.div>
        </AnimatePresence>
      </Link>
    );
  }
);

ChatResponseReasoning.displayName = 'ChatThoughts';
