import type { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const BarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isCompletedStream: boolean;
  children?: React.ReactNode;
  title: string;
  secondaryTitle?: string;
}> = React.memo(({ showBar, isCompletedStream, status, children, title, secondaryTitle }) => {
  return (
    <div className={'relative flex space-x-1.5 overflow-hidden'}>
      <VerticalBarContainer
        showBar={showBar}
        status={status}
        isCompletedStream={isCompletedStream}
      />

      <div className={`mb-2 flex w-full flex-col space-y-2 overflow-hidden`}>
        <TitleContainer
          title={title}
          secondaryTitle={secondaryTitle}
          isCompletedStream={isCompletedStream}
        />
        {children}
      </div>
    </div>
  );
});

BarContainer.displayName = 'BarContainer';

const VerticalBarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isCompletedStream: boolean;
}> = React.memo(({ showBar, isCompletedStream, status }) => {
  return (
    <div className="ml-2 flex w-5 min-w-5 flex-col items-center">
      <StatusIndicator status={status} />
      <VerticalBar show={showBar} isCompletedStream={isCompletedStream} />
    </div>
  );
});

VerticalBarContainer.displayName = 'BarContainer';

const VerticalBar: React.FC<{ show?: boolean; isCompletedStream: boolean }> = React.memo(
  ({ show, isCompletedStream }) => {
    return (
      <div
        className={cn(
          'flex w-full flex-1 justify-center overflow-hidden',
          'opacity-0 transition-opacity duration-300',
          show && 'opacity-100!'
        )}>
        <AnimatePresence initial={!isCompletedStream}>
          <motion.div
            className={cn('bg-text-tertiary w-[0.5px]', 'mt-1 overflow-hidden')}
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
          />
        </AnimatePresence>
      </div>
    );
  }
);

VerticalBar.displayName = 'VerticalBar';

const TitleContainer: React.FC<{
  title: string;
  secondaryTitle?: string;
  isCompletedStream: boolean;
}> = React.memo(({ title, secondaryTitle, isCompletedStream }) => {
  return (
    <div className={cn('@container', 'flex w-full items-center space-x-1.5 overflow-hidden')}>
      <AnimatedThoughtTitle title={title} type="default" isCompletedStream={isCompletedStream} />
      <AnimatedThoughtTitle
        title={secondaryTitle}
        isCompletedStream={isCompletedStream}
        type="tertiary"
        className="secondary-text truncate"
      />
    </div>
  );
});

TitleContainer.displayName = 'TitleContainer';

const AnimatedThoughtTitle = React.memo(
  ({
    title,
    type,
    isCompletedStream,
    className = ''
  }: {
    title: string | undefined;
    type: 'tertiary' | 'default';
    className?: string;
    isCompletedStream: boolean;
  }) => {
    const isSecondaryTitle = type === 'tertiary';
    return (
      <AnimatePresence initial={!isCompletedStream && isSecondaryTitle} mode="wait">
        {title && (
          <motion.div
            className="flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: isSecondaryTitle ? 0.5 : 0.125 }}
            key={title}>
            <Text
              size="sm"
              className={cn(
                `whitespace-nowrap`,
                isSecondaryTitle ? 'hidden @[170px]:flex!' : '',
                className
              )}
              variant={type}>
              {title}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AnimatedThoughtTitle.displayName = 'AnimatedThoughtTitle';
