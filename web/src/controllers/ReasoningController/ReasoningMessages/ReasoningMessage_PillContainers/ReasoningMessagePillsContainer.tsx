import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces/chat';
import React from 'react';
import { motion } from 'framer-motion';
import { ReasoningMessagePillContainer } from './ReasoningMessagePillContainer';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
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
    isCompletedStream: boolean;
  }
> = ({ pill_containers, status, isCompletedStream }) => {
  const hasPills = !!pill_containers && pill_containers.length > 0;

  if (!hasPills) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial={!isCompletedStream ? 'hidden' : false}
      animate="visible"
      className="flex flex-col space-y-3">
      {pill_containers.map((pill_container, index) => (
        <motion.div key={index} variants={itemVariants}>
          <ReasoningMessagePillContainer
            key={index}
            pillContainer={pill_container}
            isCompletedStream={isCompletedStream}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

ReasoningMessagePillsContainer.displayName = 'ReasoningMessagePillsContainer';
