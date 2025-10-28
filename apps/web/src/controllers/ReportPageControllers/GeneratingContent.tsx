import { AnimatePresence, motion } from 'framer-motion';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { cn } from '@/lib/classMerge';

export const GeneratingContent = ({
  className,
  show,
}: {
  messageId: string;
  className?: string;
  show: boolean;
}) => {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={cn('right-0 -bottom-18 left-0 absolute ', className)}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.12, delay: 0.15 }}
        >
          <ShimmerText text="Generating..." fontSize={15} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
