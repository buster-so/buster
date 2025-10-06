import { Command } from 'cmdk';
import React from 'react';
import type { SearchModalContentProps } from './search-modal.types';

export const SearchEmptyState: React.FC<Pick<SearchModalContentProps, 'emptyState'>> = React.memo(
  ({ emptyState }) => {
    return (
      <Command.Empty className="text-gray-light h-full w-full flex-1 flex justify-center items-center text-lg">
        {emptyState}
      </Command.Empty>
    );
  }
);
