import { useCommandState } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchModalContentItems } from './SearchModalContentItems';
import type { SearchItem, SearchItems, SearchModalContentProps } from './search-modal.types';

const duration = 0.15;

export const SearchModalItemsContainer = <M, T extends string>({
  searchItems,
  onSelectGlobal,
  onViewSearchItem,
  secondaryContent,
  openSecondaryContent,
  loading,
  onScrollToBottom,
}: {
  searchItems: SearchItems<M, T>[];
  loading: SearchModalContentProps<M, T>['loading'];
  onSelectGlobal: (d: SearchItem<M, T>) => void;
  onViewSearchItem: (item: SearchItem<M, T>) => void;
  secondaryContent: SearchModalContentProps<M, T>['secondaryContent'];
  openSecondaryContent: SearchModalContentProps<M, T>['openSecondaryContent'];
  onScrollToBottom: SearchModalContentProps<M, T>['onScrollToBottom'];
}) => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;

  return (
    <div className={cn('flex w-full overflow-hidden flex-1 relative', !hasResults && 'hidden')}>
      <motion.div
        className="overflow-y-auto flex flex-col shrink-0"
        initial={false}
        animate={{ width: openSecondaryContent ? 320 : '100%' }}
        transition={{ duration, ease: 'easeInOut' }}
      >
        <SearchModalContentItems
          searchItems={searchItems}
          loading={loading}
          onSelectGlobal={onSelectGlobal}
          onViewSearchItem={onViewSearchItem}
          onScrollToBottom={onScrollToBottom}
        />
      </motion.div>
      <AnimatePresence>
        {openSecondaryContent && (
          <motion.div
            className="flex-1 overflow-hidden border-l min-w-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: 'easeInOut' }}
            key="secondary-content"
          >
            {secondaryContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
