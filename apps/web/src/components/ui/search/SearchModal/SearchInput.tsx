import { Command } from 'cmdk';
import React from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import type { SearchModalContentProps } from './search-modal.types';

export const SearchInput: React.FC<
  Pick<
    SearchModalContentProps,
    'placeholder' | 'filterContent' | 'isModalOpen' | 'onChangeValue'
  > & {
    searchValue: string;
  }
> = React.memo(({ searchValue, onChangeValue, placeholder, filterContent, isModalOpen }) => {
  const debouncedAutoFocus = useDebounce(isModalOpen, { wait: 100 });

  return (
    <div className="flex min-h-12 items-center space-x-3 justify-between mx-6">
      <Command.Input
        className={cn('text-md placeholder:text-gray-light')}
        value={searchValue}
        placeholder={placeholder}
        onValueChange={onChangeValue}
        autoFocus={debouncedAutoFocus}
      />
      {filterContent}
    </div>
  );
});
