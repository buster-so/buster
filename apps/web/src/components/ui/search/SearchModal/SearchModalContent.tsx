import { Command } from 'cmdk';
import type React from 'react';
import { useRef } from 'react';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchFooter } from './SearchFooter';
import { SearchInput } from './SearchInput';
import { SearchLoading } from './SearchLoading';
import { SearchModalItemsContainer } from './SearchModalItemsContainer';
import type { SearchItem, SearchModalContentProps } from './search-modal.types';
import { useViewSearchItem } from './useViewSearchItem';

export const SearchModalContent = <M, T extends string>({
  open,
  searchItems,
  onChangeValue,
  onSelect,
  onViewSearchItem,
  emptyState,
  filterContent,
  placeholder,
  filterDropdownContent,
  loading,
  value: searchValue,
  secondaryContent,
  openSecondaryContent,
  shouldFilter = true,
  showTopLoading = false,
  filter,
  scrollContainerRef,
}: SearchModalContentProps<M, T>) => {
  const { handleKeyDown, focusedValue, setFocusedValue } = useViewSearchItem({
    searchItems,
    onViewSearchItem,
  });
  const isCommandKeyPressedRef = useRef(false);

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
      shouldFilter={shouldFilter}
      filter={filter}
    >
      <SearchInput
        searchValue={searchValue}
        onChangeValue={onChangeValue}
        filterContent={filterContent}
        filterDropdownContent={filterDropdownContent}
        placeholder={placeholder}
        open={open}
      />

      <SearchLoading loading={loading} showTopLoading={showTopLoading} />

      <SearchModalItemsContainer
        searchItems={searchItems}
        secondaryContent={secondaryContent}
        openSecondaryContent={openSecondaryContent}
        loading={loading}
        onSelectGlobal={onSelectGlobal}
        onViewSearchItem={onViewSearchItem}
        scrollContainerRef={scrollContainerRef}
      />

      <SearchEmptyState emptyState={emptyState} />
      <SearchFooter />
    </Command>
  );
};
