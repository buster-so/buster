import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { Text } from '@/components/ui/typography';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useGetBlackBoxMessage } from '@/context/BlackBox/blackbox-store';
import { BLACK_BOX_INITIAL_THOUGHT } from '@/context/BlackBox/useBlackboxMessage';
import { useIsEmbed } from '@/context/BusterAssets/useIsEmbed';
import { useSelectedAssetType } from '@/context/BusterAssets/useSelectedAssetType';
import { useGetCurrentMessageId } from '@/context/Chats';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay: 0, duration: 0.35 },
};

const stableLastMessageTitleSelector = (x: BusterChatMessage) =>
  x?.reasoning_messages?.[x.reasoning_message_ids?.[x.reasoning_message_ids.length - 1]]?.title;

export const ChatResponseReasoning: React.FC<{
  reasoningMessageId: string | undefined;
  finalReasoningMessage: string | undefined | null;
  isStreamFinished: boolean;
  messageId: string;
  chatId: string;
}> = React.memo(({ finalReasoningMessage, isStreamFinished, messageId, chatId }) => {
  const urlMessageId = useGetCurrentMessageId();
  const { data: lastMessageTitle } = useGetChatMessage(messageId, {
    select: stableLastMessageTitleSelector,
  });
  const isEmbed = useIsEmbed();
  const selectedFileType = useSelectedAssetType();
  const isReasonginFileSelected = selectedFileType === 'reasoning' && urlMessageId === messageId;
  const showShimmerText = isReasonginFileSelected
    ? !finalReasoningMessage
    : !isStreamFinished && !finalReasoningMessage;

  const blackBoxMessage = useGetBlackBoxMessage(messageId);

  const text: string = useMemo(() => {
    if (finalReasoningMessage) return finalReasoningMessage;
    if (blackBoxMessage) return blackBoxMessage;
    if (lastMessageTitle) return lastMessageTitle;
    return lastMessageTitle || BLACK_BOX_INITIAL_THOUGHT;
  }, [lastMessageTitle, finalReasoningMessage, blackBoxMessage]);

  return (
    <Link
      to={
        isEmbed
          ? '/embed/chat/$chatId/reasoning/$messageId'
          : isReasonginFileSelected
            ? '/app/chats/$chatId'
            : '/app/chats/$chatId/reasoning/$messageId'
      }
      params={{
        chatId,
        messageId,
      }}
      aria-label="Reasoning link"
      className="mt-0.5 leading-1.5"
    >
      <AnimatePresence initial={!isStreamFinished} mode="wait">
        <motion.div
          {...animations}
          key={text}
          className="flex h-[14px] max-h-[14px] w-fit cursor-pointer items-center"
        >
          {!showShimmerText ? (
            <Text
              variant={isReasonginFileSelected ? 'default' : 'secondary'}
              className="hover:text-text-default hover:underline"
            >
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
