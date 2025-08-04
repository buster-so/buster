import type { BusterChatMessageReasoning_file } from '@/api/asset_interfaces/chat';
import React, { useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { CheckDouble } from '@/components/ui/icons';
import { CircleWarning } from '@/components/ui/icons/NucleoIconFilled';
import { AnimatePresence, motion, type MotionProps } from 'framer-motion';

const animationProps: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const StreamingMessageStatus = React.memo(
  ({
    status,
    fileType
  }: {
    status: BusterChatMessageReasoning_file['status'];
    fileType: BusterChatMessageReasoning_file['file_type'];
  }) => {
    const content = useMemo(() => {
      if (fileType === 'todo' || fileType === 'agent-action' || fileType === 'reasoning') {
        return null;
      }

      const _typeCheck: 'metric' | 'dashboard' | 'report' = fileType;

      if (status === 'loading')
        return (
          <div className="flex items-center gap-1.5">
            <Text variant={'secondary'} size={'sm'}>
              Running SQL...
            </Text>
            <CircleSpinnerLoader size={9} fill={'var(--color-text-primary)'} />
          </div>
        );
      if (status === 'completed')
        return (
          <Text variant={'secondary'} size={'sm'} className="flex items-center gap-1.5">
            Completed <CheckDouble />
          </Text>
        );
      if (status === 'failed')
        return (
          <Text variant={'danger'} size={'sm'} className="flex items-center gap-1.5">
            Failed <CircleWarning />
          </Text>
        );
    }, [status, fileType]);

    return (
      <AnimatePresence mode="wait">
        <motion.div {...animationProps} key={status}>
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }
);

StreamingMessageStatus.displayName = 'StreamingMessageStatus';
