import { AnimatePresence, motion, type MotionProps } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import type { BusterChatMessageReasoning_pill, FileType } from '@/api/asset_interfaces/chat';
import { Popover } from '@/components/ui/popover/Popover';
import { useMemoizedFn } from '@/hooks';
import { assetParamsToRoute } from '@/lib/assets';
import { cn } from '@/lib/classMerge';

const duration = 0.25;
const maxStaggerDuration = 0.12; // 800ms max total duration

const containerVariants: MotionProps['variants'] = {
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
      staggerChildren: maxStaggerDuration / 20, // Adjust stagger based on max duration
      delayChildren: 0,
      staggerDirection: 1,
      when: 'beforeChildren'
    }
  }
};

const pillVariants: MotionProps['variants'] = {
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
  chatId: string;
}> = React.memo(({ pills = [], isCompletedStream, chatId }) => {
  const useAnimation = !isCompletedStream;

  const makeHref = useMemoizedFn((pill: Pick<BusterChatMessageReasoning_pill, 'id' | 'type'>) => {
    const link = assetParamsToRoute({
      chatId,
      assetId: pill.id,
      type: pill.type as FileType
    });
    if (link) return link;
    return '';
  });

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={pills.length > 0 ? 'visible' : 'hidden'}
        className={'flex w-full flex-wrap gap-1.5 overflow-hidden'}>
        {pills.map((pill) => (
          <Link href={makeHref(pill)} key={pill.id} prefetch={true}>
            <Pill useAnimation={useAnimation} {...pill} />
          </Link>
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
          'text-text-secondary bg-item-active border-border hover:bg-item-hover-active flex h-[18px] min-h-[18px] items-center justify-center rounded-sm border px-1 text-xs whitespace-nowrap transition-all',
          !!onClick && 'cursor-pointer',
          className
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
