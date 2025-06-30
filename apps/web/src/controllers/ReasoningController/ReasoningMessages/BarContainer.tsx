import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import type { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
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
    <div className={'relative flex space-x-1.5 overflow-visible'}>
      <VerticalBarContainer
        showBar={showBar}
        status={status}
        isCompletedStream={isCompletedStream}
      />

      <div className={'mb-2 flex w-full min-w-0 flex-col space-y-2'}>
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
    <div className="ml-2 flex w-5 min-w-5 flex-col items-center pt-0.5">
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
    <div className={cn('@container flex w-full items-center space-x-1.5 overflow-hidden')}>
      <AnimatePresence mode="wait" initial={!isCompletedStream}>
        <motion.div
          className="flex items-center space-x-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0 }}
          key={title + secondaryTitle}>
          <Text size="sm" className={cn('whitespace-nowrap')} variant={'default'}>
            {title}
          </Text>
          {secondaryTitle && (
            <Text
              size="sm"
              className={cn('hidden whitespace-nowrap @[170px]:flex!')}
              variant={'tertiary'}>
              {secondaryTitle}
            </Text>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

TitleContainer.displayName = 'TitleContainer';
