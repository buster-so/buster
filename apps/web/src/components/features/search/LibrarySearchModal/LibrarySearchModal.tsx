import React, { useRef, useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type { SearchModalContentProps } from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useLibrarySearchStore } from './library-store';

export const LibrarySearchModal = React.memo(() => {
  const { isOpen, onCloseLibrarySearch, value, setLibrarySearchValue } = useLibrarySearchStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const itemsToAdd = useRef<Set<string>>(new Set());
  const itemsToRemove = useRef<Set<string>>(new Set());

  const { allResults, isFetchingNextPage, isFetched, scrollContainerRef } = useSearchInfinite({
    page_size: 25,
    enabled: isOpen,
    mounted: isOpen,
    includeAssetAncestors: true,
    includeScreenshots: true,
    scrollConfig: {
      scrollThreshold: 55,
    },
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
        children: 'Update library',
        variant: 'default',
        onClick: () => {
          alert('TODO: Update library');
        },
      },
    }),
    [!!selectedItems.size, onCloseLibrarySearch, setSelectedItems]
  );

  const handleSelect = useMemoizedFn((items: Set<string>) => {
    console.log(items);
    setSelectedItems(items);
  });

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
      onSelect={handleSelect}
      scrollContainerRef={scrollContainerRef}
      footerConfig={footerConfig}
    />
  );
});

LibrarySearchModal.displayName = 'LibrarySearchModal';
