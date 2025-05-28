import type React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';

export const PopupContainer: React.FC<{
  show: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ show, children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={cn(
            'absolute right-0 bottom-10 left-0 z-50 flex w-full justify-center',
            className
          )}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12 }}>
          <div className="bg-background rounded px-2 py-1.5 shadow-md">
            {show && <>{children}</>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PopupSplitter: React.FC = () => {
  return <div className="bg-border h-[17px] w-[0.5px]" />;
};
