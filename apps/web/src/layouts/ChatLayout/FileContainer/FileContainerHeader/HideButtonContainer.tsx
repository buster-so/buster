import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

const displayAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

export const HideButtonContainer: React.FC<{
  children: React.ReactNode;
  show: boolean;
}> = ({ children, show }) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {show && <motion.div {...displayAnimation}>{children}</motion.div>}
    </AnimatePresence>
  );
};

HideButtonContainer.displayName = 'HideButtonContainer';
