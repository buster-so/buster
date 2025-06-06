import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/classMerge';
import { CircleWarning, RadioChecked } from '../icons';

const animationConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const StatusIndicator: React.FC<{
  status?: 'completed' | 'loading' | 'failed';
  isCompletedStream?: boolean;
}> = React.memo(({ status = 'completed' }) => {
  const inProgress = status === 'loading';
  const failed = status === 'failed';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={status}
        className={cn(
          'text-gray-light relative flex items-center justify-center transition-all duration-300',
          inProgress && 'text-primary',
          failed && 'text-danger-foreground'
        )}>
        {inProgress && (
          <div className="bg-primary/30 absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full duration-1000" />
        )}

        {failed ? <CircleWarning /> : <RadioChecked />}
      </motion.div>
    </AnimatePresence>
  );
});

StatusIndicator.displayName = 'StatusIndicator';
