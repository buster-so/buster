import React, { useCallback, useState } from 'react';
import { useDeleteLibraryAssets, usePostLibraryAssets } from '@/api/buster_rest/library';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type {
  SearchModalContentProps,
  SearchMode,
} from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { parseSelectionKey, SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useCommonSearch } from '../useCommonSearch';
import { useSearchMultiSelect } from '../useSearchMultiSelect';
import { useLibrarySearchStore } from './library-store';

const mode: SearchMode = 'select-multiple';

export const LibrarySearchModal = React.memo(() => {
  const { mutateAsync: postLibraryAssets, isPending: isPostingLibraryAssets } =
    usePostLibraryAssets();
  const { mutateAsync: removeLibraryAssets, isPending: isRemovingLibraryAssets } =
    useDeleteLibraryAssets();

  const { isOpen, onCloseLibrarySearch } = useLibrarySearchStore();

  const {
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    searchQuery,
    setSearchQuery,
    setSelectedAssets,
    setSelectedDateRange,
  } = useCommonSearch({ mode });

  const {
    itemsToAdd,
    itemsToRemove,
    setItemsToAdd,
    setItemsToRemove,
    isItemSelected,
    handleSelectItem,
    onCloseModalAndReset,
  } = useSearchMultiSelect({
    setSearchQuery,
    onCloseModal: onCloseLibrarySearch,
    setSelectedAssets,
    setSelectedDateRange,
  });

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
    includeAddedToLibrary: true,
  });

  const onSubmit = useMemoizedFn(async () => {
    // Parse composite keys back to { assetId, assetType } objects
    const assetsToAddParsed = Array.from(itemsToAdd).map((key) => parseSelectionKey(key));
    const assetsToRemoveParsed = Array.from(itemsToRemove).map((key) => parseSelectionKey(key));

    // Execute both operations
    if (assetsToAddParsed.length > 0) {
      await postLibraryAssets(assetsToAddParsed);
    }

    if (assetsToRemoveParsed.length > 0) {
      await removeLibraryAssets(assetsToRemoveParsed);
    }

    onCloseModalAndReset();
  });

  const footerConfig = React.useMemo<SearchModalContentProps['footerConfig']>(
    () => ({
      tertiaryButton: {
        children: 'Clear selection',
        disabled: itemsToAdd.size === 0 && itemsToRemove.size === 0,
        variant: 'ghost',
        onClick: () => {
          setItemsToAdd(new Set());
          setItemsToRemove(new Set());
        },
      },
      secondaryButton: {
        children: 'Cancel',
        variant: 'ghost',
        onClick: onCloseModalAndReset,
      },
      primaryButton: {
        children: 'Update library',
        variant: 'default',
        loading: isPostingLibraryAssets || isRemovingLibraryAssets,
        onClick: onSubmit,
      },
    }),
    [
      itemsToAdd.size,
      itemsToRemove.size,
      onCloseModalAndReset,
      isPostingLibraryAssets,
      isRemovingLibraryAssets,
      postLibraryAssets,
      removeLibraryAssets,
    ]
  );

  return (
    <SearchModalBase
      isOpen={isOpen}
      onClose={onCloseModalAndReset}
      mode={mode}
      value={searchQuery}
      onChangeValue={setSearchQuery}
      items={allResults}
      onSelect={handleSelectItem}
      isItemSelected={isItemSelected}
      loading={isFetchingNextPage || !isFetched}
      filterContent={null}
      scrollContainerRef={scrollContainerRef}
      footerConfig={footerConfig}
    />
  );
});

LibrarySearchModal.displayName = 'LibrarySearchModal';
