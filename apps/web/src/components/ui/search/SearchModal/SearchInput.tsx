import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { SearchModalContentProps } from './search-modal.types';

export const SearchInput: React.FC<
  Pick<
    SearchModalContentProps,
    'placeholder' | 'filterContent' | 'open' | 'onChangeValue' | 'filterDropdownContent'
  > & {
    searchValue: string;
  }
> = React.memo(
  ({ searchValue, filterDropdownContent, onChangeValue, placeholder, filterContent, open }) => {
    const debouncedAutoFocus = useDebounce(open, { wait: 100 });

    return (
      <div className="flex flex-col gap-y-0">
        <div className="flex min-h-12 items-center space-x-3 justify-between px-5">
          <Command.Input
            className={cn('text-md placeholder:text-gray-light w-full h-full')}
            value={searchValue}
            placeholder={placeholder}
            onValueChange={onChangeValue}
            autoFocus={debouncedAutoFocus}
            tabIndex={0}
          />
          {filterContent}
        </div>
        <AnimatePresence initial={false} mode="wait">
          {filterDropdownContent && (
            <motion.div
              className="overflow-hidden shadow-[0_-1px_0_0_var(--border)] flex items-center px-5"
              initial={{ opacity: 0, height: '0px' }}
              animate={{ opacity: 1, height: '40px' }}
              exit={{ opacity: 0, height: '0px' }}
              transition={{
                height: { duration: 0.15 },
                opacity: { duration: 0.15, delay: 0.065 },
              }}
            >
              {filterDropdownContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
