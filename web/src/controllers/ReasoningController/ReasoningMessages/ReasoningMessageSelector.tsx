import { AnimatePresence, motion, type MotionProps } from 'framer-motion';
import React from 'react';
import { useMemo } from 'react';
import type {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_text
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { BarContainer } from './BarContainer';
import { ReasoningMessage_Files } from './ReasoningMessage_Files';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillContainers';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';

const itemAnimationConfig: MotionProps = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: 'auto',
    transition: {
      height: {
        type: 'spring',
        stiffness: 400,
        damping: 32
      },
      opacity: { duration: 0.16 }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        type: 'spring',
        stiffness: 450,
        damping: 35
      },
      opacity: { duration: 0.12 }
    }
  }
};

export interface ReasoningMessageProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
}

const ReasoningMessageRecord: Record<
  BusterChatMessageReasoning['type'],
  React.FC<ReasoningMessageProps>
> = {
  pills: ReasoningMessage_PillsContainer,
  text: ReasoningMessage_Text,
  files: ReasoningMessage_Files
};

export interface ReasoningMessageSelectorProps {
  reasoningMessageId: string;
  messageId: string;
  isCompletedStream: boolean;
  chatId: string;
  isLastMessage: boolean;
}

export const ReasoningMessageSelector: React.FC<ReasoningMessageSelectorProps> = React.memo(
  ({ reasoningMessageId, isCompletedStream, chatId, messageId, isLastMessage }) => {
    const { data: messageStuff } = useGetChatMessage(messageId, {
      select: (x) => ({
        title: x?.reasoning_messages[reasoningMessageId]?.title,
        secondary_title: x?.reasoning_messages[reasoningMessageId]?.secondary_title,
        type: x?.reasoning_messages[reasoningMessageId]?.type,
        status: x?.reasoning_messages[reasoningMessageId]?.status,
        hasMessage: !!(x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_text)
          ?.message
      })
    });
    const { title, secondary_title, type, status, hasMessage } = messageStuff || {};

    const showBar = useMemo(() => {
      if (type === 'text') return !!hasMessage || !isLastMessage;
      return true;
    }, [type, hasMessage, isLastMessage]);

    if (!type || !status) return null;

    const ReasoningMessage = ReasoningMessageRecord[type];
    const animationKey = reasoningMessageId + type;

    return (
      <BarContainer
        showBar={showBar}
        status={status}
        isCompletedStream={isCompletedStream}
        title={title ?? ''}
        secondaryTitle={secondary_title ?? ''}>
        <AnimatePresence mode="wait" initial={!isCompletedStream}>
          <motion.div
            key={animationKey}
            {...itemAnimationConfig}
            layout={!isCompletedStream}
            className="overflow-hidden">
            <div className="min-h-[1px]">
              <ReasoningMessage
                reasoningMessageId={reasoningMessageId}
                isCompletedStream={isCompletedStream}
                messageId={messageId}
                chatId={chatId}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </BarContainer>
    );
  }
);

ReasoningMessageSelector.displayName = 'ReasoningMessageSelector';
