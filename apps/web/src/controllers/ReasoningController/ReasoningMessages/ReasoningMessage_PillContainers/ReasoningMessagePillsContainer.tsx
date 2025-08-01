import { motion, type MotionProps } from 'framer-motion';
import type React from 'react';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces/chat';
import { ReasoningMessagePillContainer } from './ReasoningMessagePillContainer';

const containerVariants: MotionProps['variants'] = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: MotionProps['variants'] = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      opacity: {
        duration: 0.62,
        ease: [0.34, 1.56, 0.64, 1] // Bouncy easeOutBack
      }
    }
  }
};

export const ReasoningMessagePillsContainer: React.FC<
  BusterChatMessageReasoning_pills & {
    status: NonNullable<BusterChatMessageReasoning_pills['status']>;
    isStreamFinished: boolean;
    chatId: string;
  }
> = ({ pill_containers, status, isStreamFinished, chatId }) => {
  const hasPills = !!pill_containers && pill_containers.length > 0;

  if (!hasPills) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial={!isStreamFinished ? 'hidden' : false}
      animate="visible"
      className="flex flex-col space-y-3">
      {pill_containers.map((pill_container, index) => (
        <motion.div key={pill_container.title + index.toString()} variants={itemVariants}>
          <ReasoningMessagePillContainer
            pillContainer={pill_container}
            isStreamFinished={isStreamFinished}
            chatId={chatId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

ReasoningMessagePillsContainer.displayName = 'ReasoningMessagePillsContainer';
