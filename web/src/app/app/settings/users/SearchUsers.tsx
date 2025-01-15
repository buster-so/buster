import React, { useState, useTransition } from 'react';
import { SearchInput } from '@/components/inputs';

export const SearchUsers: React.FC<{
  onChange: (value: string) => void;
}> = React.memo(({ onChange }) => {
  return (
    <div className="flex max-w-[400px] items-center space-x-2">
      <SearchInput
        className="max-w-[280px]"
        placeholder="Search users name or email..."
        onChange={onChange}
      />
    </div>
  );
});

SearchUsers.displayName = 'SearchUsers';
