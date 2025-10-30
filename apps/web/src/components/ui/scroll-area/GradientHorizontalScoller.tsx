import { AnimatePresence, motion } from 'framer-motion';
import React, { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/classMerge';

export const GradientHorizontalScoller: React.FC<
  PropsWithChildren<{
    // biome-ignore lint/suspicious/noExplicitAny: any is used to avoid type errors
    effectTrigger?: any;
  }>
> = ({ children, effectTrigger }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        // Show left gradient if scrolled from start
        setShowLeftGradient(scrollLeft > 0);

        // Show right gradient if not scrolled to end and content is overflowing
        setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 1);
      }
    };

    checkScrollPosition();

    const resizeObserver = new ResizeObserver(checkScrollPosition);
    const scrollContainer = scrollContainerRef.current;

    if (scrollContainer) {
      resizeObserver.observe(scrollContainer);
      scrollContainer.addEventListener('scroll', checkScrollPosition);
    }

    return () => {
      resizeObserver.disconnect();
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [effectTrigger]);

  const commonGradientClasses = 'w-15 h-full absolute top-0 pointer-events-none';

  return (
    <div className="relative">
      <div
        className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none"
        ref={scrollContainerRef}
      >
        {children}
      </div>
      <AnimatePresence>
        {showLeftGradient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              commonGradientClasses,
              'left-0 bg-gradient-to-r from-page-background to-transparent'
            )}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRightGradient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              commonGradientClasses,
              'right-0 bg-gradient-to-l from-page-background to-transparent'
            )}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
