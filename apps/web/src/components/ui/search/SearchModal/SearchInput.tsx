import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { SearchModalContentProps } from './search-modal.types';

export const SEARCH_INPUT_ID = 'search-input-modal-input';

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
      <div className="flex flex-col gap-y-0" id={SEARCH_INPUT_ID}>
        <div className="flex min-h-12 items-center space-x-3 justify-between px-5">
          <Command.Input
            className={cn('text-md placeholder:text-gray-light w-full h-full')}
            value={searchValue}
            placeholder={placeholder}
            onValueChange={onChangeValue}
            autoFocus={debouncedAutoFocus}
            tabIndex={0}
            data-testid="search-input"
          />
          {filterContent}
        </div>
        {filterDropdownContent}
      </div>
    );
  }
);
