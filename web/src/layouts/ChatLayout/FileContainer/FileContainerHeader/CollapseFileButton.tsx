import { DoubleChevronRight } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppTooltip } from '@/components/ui/tooltip';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const CollapseFileButton: React.FC<{
  showCollapseButton: boolean;
  onCollapseFileClick: () => void;
}> = React.memo(({ showCollapseButton, onCollapseFileClick }) => {
  const icon = <DoubleChevronRight />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showCollapseButton && (
        <motion.div variants={animation} aria-label="Collapse file button">
          <AppTooltip title="Collapse file" delayDuration={350}>
            <Button
              onClick={onCollapseFileClick}
              variant="ghost"
              prefix={icon}
              data-testid="collapse-file-button"></Button>
          </AppTooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CollapseFileButton.displayName = 'CollapseFileButton';
