import { Command } from 'cmdk';
import React from 'react';
import { cn } from '@/lib/utils';
import type { SearchModalContentProps } from './search-modal.types';

export const SearchInput: React.FC<
  Pick<SearchModalContentProps, 'onSearchChange' | 'placeholder' | 'filterContent'> & {
    searchValue: string;
  }
> = React.memo(({ searchValue, onSearchChange, placeholder, filterContent }) => {
  return (
    <div className="flex min-h-12 items-center space-x-3 justify-between mx-6">
      <Command.Input
        className={cn('text-md placeholder:text-gray-light')}
        value={searchValue}
        placeholder={placeholder}
        onValueChange={onSearchChange}
        autoFocus
      />
      {filterContent}
    </div>
  );
});
