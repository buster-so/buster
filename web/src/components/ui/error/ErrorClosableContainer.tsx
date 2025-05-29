'use client';

import { cn } from '@/lib/classMerge';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { CircleWarning, Xmark } from '../icons';

export const ErrorClosableContainer: React.FC<{
  error: string;
  onClose?: () => void;
  className?: string;
}> = React.memo(({ error, onClose, className = '' }) => {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setClosed(false);
  }, [error]);

  return (
    <AnimatePresence mode="wait">
      {!closed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          className={cn(
            'bg-danger-background text-danger-foreground border-danger-foreground rounded-sm px-2 py-3 shadow',
            'absolute right-0 bottom-0 left-0 mx-4 mb-2', //TODO: fix this
            className
          )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleWarning />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                setClosed(true);
              }}
              className={cn(
                'text-danger-foreground flex items-center justify-center border-none bg-none hover:opacity-80',
                'cursor-pointer rounded-sm p-0.5 transition-colors hover:bg-black/5'
              )}>
              <Xmark />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ErrorClosableContainer.displayName = 'ErrorClosableContainer';
