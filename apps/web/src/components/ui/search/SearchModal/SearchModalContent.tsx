import { Command } from 'cmdk';
import React, { useState } from 'react';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchFooter } from './SearchFooter';
import { SearchInput } from './SearchInput';
import { SearchModalContentItems } from './SearchModalContentItems';
import type { SearchItem, SearchModalContentProps } from './search-modal.types';

export const SearchModalContent = <M, T extends string>({
  searchItems,
  onSearchChange,
  onSelect,
  onViewSearchItem,
  emptyState,
  defaulSearchValue = '',
  filterContent,
  placeholder,
  filterDropdownContent,
  loading,
  secondaryContent,
  openSecondaryContent,
}: SearchModalContentProps<M, T>) => {
  const [searchValue, setSearchValue] = useState<string>(defaulSearchValue);

  const onSearchChangePreflight = (searchValue: string) => {
    setSearchValue(searchValue);
    onSearchChange(searchValue);
  };

  return (
    <Command
      className="min-w-[650px] min-h-[450px] max-h-[75vh] bg-background flex flex-col"
      value={searchValue}
    >
      <SearchInput
        searchValue={searchValue}
        onSearchChange={onSearchChangePreflight}
        filterContent={filterContent}
        placeholder={placeholder}
      />
      <div className="border-b" />
      <SearchModalContentItems
        searchItems={searchItems}
        onSelect={onSelect}
        onViewSearchItem={onViewSearchItem}
      />
      <SearchEmptyState emptyState={emptyState} />
      <SearchFooter />
    </Command>
  );
};
