import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import type { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const BarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isStreamFinished: boolean;
  children?: React.ReactNode;
  title: string;
  secondaryTitle?: string;
}> = ({ showBar, isStreamFinished, status, children, title, secondaryTitle }) => {
  return (
    <div className={'relative flex space-x-1.5 overflow-visible'}>
      <VerticalBarContainer showBar={showBar} status={status} isStreamFinished={isStreamFinished} />

      <div className={'mb-2 flex w-full min-w-0 flex-col space-y-2'}>
        <TitleContainer
          title={title}
          secondaryTitle={secondaryTitle}
          isStreamFinished={isStreamFinished}
        />
        {children}
      </div>
    </div>
  );
};

BarContainer.displayName = 'BarContainer';

const VerticalBarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isStreamFinished: boolean;
}> = React.memo(({ showBar, isStreamFinished, status }) => {
  return (
    <div className="ml-2 flex w-5 min-w-5 flex-col items-center pt-0.5">
      <StatusIndicator status={status} />
      <VerticalBar show={showBar} isStreamFinished={isStreamFinished} />
    </div>
  );
});

VerticalBarContainer.displayName = 'BarContainer';

const VerticalBar: React.FC<{ show?: boolean; isStreamFinished: boolean }> = React.memo(
  ({ show, isStreamFinished }) => {
    return (
      <div
        className={cn(
          'flex w-full flex-1 justify-center overflow-hidden',
          'opacity-0 transition-opacity duration-300',
          show && 'opacity-100!'
        )}>
        <AnimatePresence initial={!isStreamFinished}>
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
  isStreamFinished: boolean;
}> = React.memo(({ title, secondaryTitle, isStreamFinished }) => {
  return (
    <div className={cn('@container flex w-full items-center space-x-1.5 overflow-hidden')}>
      <AnimatePresence mode="wait" initial={!isStreamFinished}>
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
