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
        children: 'Select',
        disabled: selectedItems.size === 0,
        onClick: () => {
          setSelectedItems(new Set());
        },
      },
    }),
    [selectedItems.size, setSelectedItems]
  );

  console.log('footerConfig', footerConfig);

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
