import type { BusterChatMessageReasoning_pill } from '@/api/asset_interfaces/chat';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemoizedFn } from '@/hooks';
import { Popover } from '@/components/ui/tooltip/Popover';
import {
  isOpenableFile,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { type SelectedFile } from '@/layouts/ChatLayout/interfaces';
import { cn } from '@/lib/classMerge';

const duration = 0.25;

const containerVariants = {
  hidden: {
    opacity: 0,
    transition: {
      opacity: { duration: duration * 0.5, ease: 'easeOut' }
    }
  },
  visible: {
    opacity: 1,
    transition: {
      opacity: { duration: duration * 0.5, ease: 'easeIn' },
      staggerChildren: 0.08
    }
  }
};

const pillVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration * 0.85,
      ease: 'easeOut'
    }
  }
};

export const ReasoningMessagePills: React.FC<{
  pills: BusterChatMessageReasoning_pill[];
  isCompletedStream: boolean;
}> = React.memo(({ pills = [], isCompletedStream }) => {
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);

  const useAnimation = !isCompletedStream;

  const handlePillClick = useMemoizedFn(
    (pill: Pick<BusterChatMessageReasoning_pill, 'id' | 'type'>) => {
      if (isOpenableFile(pill.type)) {
        onSetSelectedFile(pill as SelectedFile);
      }
    }
  );

  const isClickablePill = useMemo(() => {
    return pills.some((pill) => isOpenableFile(pill.type));
  }, [pills]);

  const onClick = isClickablePill ? handlePillClick : undefined;

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={pills.length > 0 ? 'visible' : 'hidden'}
        className={'flex w-full flex-wrap gap-1.5 overflow-hidden'}>
        {pills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={onClick} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
});

ReasoningMessagePills.displayName = 'ReasoningMessagePills';

const Pill: React.FC<{
  text: string;
  id?: string;
  type?: BusterChatMessageReasoning_pill['type'];
  useAnimation: boolean;
  className?: string;
  onClick?: (pill: Pick<BusterChatMessageReasoning_pill, 'id' | 'type'>) => void;
}> = React.memo(({ text, type, id, useAnimation, className = '', onClick }) => {
  return (
    <AnimatePresence initial={useAnimation}>
      <motion.div
        onClick={() => !!id && !!type && onClick?.({ id, type })}
        variants={pillVariants}
        className={cn(
          'text-text-secondary bg-item-active border-border hover:bg-item-hover-active h-[18px] min-h-[18px] rounded-sm border px-1 text-xs',
          className,
          !!onClick && 'cursor-pointer',
          'flex items-center justify-center whitespace-nowrap'
        )}>
        {text}
      </motion.div>
    </AnimatePresence>
  );
});

Pill.displayName = 'Pill';

const OverflowPill = React.memo(
  ({
    hiddenPills,
    useAnimation,
    onClickPill
  }: {
    hiddenPills: BusterChatMessageReasoning_pill[];
    useAnimation: boolean;
    onClickPill: (pill: Pick<BusterChatMessageReasoning_pill, 'id' | 'type'>) => void;
  }) => {
    const count = hiddenPills.length;

    const content = (
      <div className="flex max-w-[400px] flex-wrap gap-1">
        {hiddenPills.map((pill) => (
          <Pill key={pill.id} useAnimation={useAnimation} {...pill} onClick={undefined} />
        ))}
      </div>
    );

    return (
      <Popover size={'sm'} content={content}>
        <div>
          <Pill className="cursor-pointer" useAnimation={useAnimation} text={`+${count} more`} />
        </div>
      </Popover>
    );
  }
);

OverflowPill.displayName = 'OverflowPill';
