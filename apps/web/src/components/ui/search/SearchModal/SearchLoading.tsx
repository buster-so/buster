import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IndeterminateLinearLoader } from '../../loaders';

export const SearchLoading = ({
  loading = false,
  showTopLoading = false,
}: {
  loading?: boolean;
  showTopLoading?: boolean;
}) => {
  return (
    <Command.Loading className="w-full border-b relative">
      <AnimatePresence initial={false} mode="wait">
        {showTopLoading && loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.125 }}
          >
            <IndeterminateLinearLoader
              className={cn('w-full absolute top-0 left-0 right-0')}
              height={0.5}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Command.Loading>
  );
};
