import React, { useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type { SearchModalContentProps } from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useLibrarySearchStore } from './library-store';

export const LibrarySearchModal = React.memo(() => {
  const { isOpen, onCloseLibrarySearch, value, setLibrarySearchValue } = useLibrarySearchStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { allResults, isFetchingNextPage, isFetched, scrollContainerRef } = useSearchInfinite({
    page_size: 20,
    enabled: isOpen,
    mounted: isOpen,
  });

  const footerConfig = React.useMemo<SearchModalContentProps['footerConfig']>(
    () => ({
      tertiaryButton: {
        children: 'Clear selection',
        disabled: selectedItems.size === 0,
        variant: 'ghost',
        onClick: () => {
          setSelectedItems(new Set());
        },
      },
      secondaryButton: {
        children: 'Cancel',
        variant: 'ghost',
        onClick: () => {
          onCloseLibrarySearch();
        },
      },
      primaryButton: {
        children: 'Add to library',
        variant: 'default',
        onClick: () => {
          alert('TODO: Add to library');
        },
      },
    }),
    [!!selectedItems.size, onCloseLibrarySearch, setSelectedItems]
  );

  return (
    <SearchModalBase
      isOpen={isOpen}
      onClose={onCloseLibrarySearch}
      mode="select-multiple"
      value={value}
      onChangeValue={setLibrarySearchValue}
      items={allResults}
      selectedItems={selectedItems}
      loading={isFetchingNextPage || !isFetched}
      filterContent={null}
      onSelect={setSelectedItems}
      scrollContainerRef={scrollContainerRef}
      footerConfig={footerConfig}
    />
  );
});

LibrarySearchModal.displayName = 'LibrarySearchModal';
