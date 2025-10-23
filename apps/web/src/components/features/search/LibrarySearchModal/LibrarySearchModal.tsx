import type { AssetType } from '@buster/server-shared/assets';
import React, { useMemo, useRef, useState } from 'react';
import { useDeleteLibraryAssets, usePostLibraryAssets } from '@/api/buster_rest/library';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type {
  SearchModalContentProps,
  SearchMode,
} from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { parseSelectionKey, SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useCommonSearch } from '../useCommonSearch';
import { useLibrarySearchStore } from './library-store';

const mode: SearchMode = 'select-multiple';

export const LibrarySearchModal = React.memo(() => {
  const { mutate: postLibraryAssets, isPending: isPostingLibraryAssets } = usePostLibraryAssets();
  const { mutate: removeLibraryAssets, isPending: isRemovingLibraryAssets } =
    useDeleteLibraryAssets();

  const { isOpen, onCloseLibrarySearch } = useLibrarySearchStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const fullSelectedItems = useRef<Set<{ assetId: string; assetType: AssetType }>>(new Set());

  const {
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    searchQuery,
    setSearchQuery,
    ...rest
  } = useCommonSearch({ mode });

  const { allResults, isFetchingNextPage, isFetched, scrollContainerRef } = useSearchInfinite({
    page_size: 25,
    assetTypes,
    startDate: selectedDateRange?.from?.toISOString(),
    endDate: selectedDateRange?.to?.toISOString(),
    query: debouncedSearchQuery,
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
        loading: isPostingLibraryAssets || isRemovingLibraryAssets,
        onClick: () => {
          // Parse composite keys back to { assetId, assetType } objects
          const assetsToAdd = Array.from(selectedItems).map((key) => parseSelectionKey(key));

          postLibraryAssets(assetsToAdd);

          // If you need to track removals, you'd do similar:
          // const assetsToRemove = Array.from(itemsToRemove).map((key) => parseSelectionKey(key));
          // removeLibraryAssets(assetsToRemove);
        },
      },
    }),
    [
      !!selectedItems.size,
      onCloseLibrarySearch,
      setSelectedItems,
      isPostingLibraryAssets,
      isRemovingLibraryAssets,
    ]
  );

  const handleSelect = useMemoizedFn((items: Set<string>) => {
    setSelectedItems(items);
  });

  return (
    <SearchModalBase
      isOpen={isOpen}
      onClose={onCloseLibrarySearch}
      mode={mode}
      value={searchQuery}
      onChangeValue={setSearchQuery}
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
