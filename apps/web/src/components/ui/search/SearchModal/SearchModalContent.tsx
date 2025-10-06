import { Command } from 'cmdk';
import React, { useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchFooter } from './SearchFooter';
import { SearchInput } from './SearchInput';
import { SearchModalContentItems } from './SearchModalContentItems';
import { SearchModalItemsContainer } from './SearchModalItemsContainer';
import type { SearchItem, SearchModalContentProps } from './search-modal.types';
import { useViewSearchItem } from './useViewSearchItem';

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
  const { handleKeyDown, focusedValue, setFocusedValue } = useViewSearchItem({
    searchItems,
    onViewSearchItem,
  });
  const [searchValue, setSearchValue] = useState<string>(defaulSearchValue);
  const isCommandKeyPressedRef = useRef(false);

  const onSearchChangePreflight = (searchValue: string) => {
    setSearchValue(searchValue);
    onSearchChange(searchValue);
  };

  const handleKeyDownGlobal = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      isCommandKeyPressedRef.current = true;
    }
    handleKeyDown(e);
  };

  const handleKeyUpGlobal = (e: React.KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
      isCommandKeyPressedRef.current = false;
    }
  };

  const onSelectGlobal = (item: SearchItem<M, T>) => {
    if (item?.onSelect) {
      item.onSelect();
    }
    onSelect(item, isCommandKeyPressedRef.current ? 'navigate' : 'select');
  };

  return (
    <Command
      className="min-w-[750px] w-[750px] min-h-[450px] max-h-[75vh] bg-background flex flex-col"
      value={focusedValue}
      onValueChange={setFocusedValue}
      onKeyDown={handleKeyDownGlobal}
      onKeyUp={handleKeyUpGlobal}
    >
      <SearchInput
        searchValue={searchValue}
        onSearchChange={onSearchChangePreflight}
        filterContent={filterContent}
        placeholder={placeholder}
      />
      <div className="border-b" />
      <SearchModalItemsContainer
        searchItems={searchItems}
        secondaryContent={secondaryContent}
        openSecondaryContent={openSecondaryContent}
        onSelectGlobal={onSelectGlobal}
        onViewSearchItem={onViewSearchItem}
      />
      <SearchEmptyState emptyState={emptyState} />
      <SearchFooter />
    </Command>
  );
};
