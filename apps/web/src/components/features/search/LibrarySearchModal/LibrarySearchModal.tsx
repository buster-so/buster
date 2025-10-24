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
import { useLibrarySearchStore } from './library-store';

const mode: SearchMode = 'select-multiple';

export const LibrarySearchModal = React.memo(() => {
  const { mutate: postLibraryAssets, isPending: isPostingLibraryAssets } = usePostLibraryAssets();
  const { mutate: removeLibraryAssets, isPending: isRemovingLibraryAssets } =
    useDeleteLibraryAssets();

  const { isOpen, onCloseLibrarySearch: onCloseLibrarySearchStore } = useLibrarySearchStore();

  // Track items to add (were NOT in library, user selected them)
  const [itemsToAdd, setItemsToAdd] = useState<Set<string>>(new Set());
  // Track items to remove (were IN library, user unselected them)
  const [itemsToRemove, setItemsToRemove] = useState<Set<string>>(new Set());

  // Handle item selection - route to appropriate Set based on library status
  const handleSelectItem = useMemoizedFn((itemKey: string, wasInLibrary: boolean) => {
    if (wasInLibrary) {
      // Item was in library, toggle in "remove" Set
      setItemsToRemove((prev) => {
        const next = new Set(prev);
        next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
        return next;
      });
    } else {
      // Item was NOT in library, toggle in "add" Set
      setItemsToAdd((prev) => {
        const next = new Set(prev);
        next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
        return next;
      });
    }
  });

  // Check if item should appear selected
  const isItemSelected = useCallback(
    (itemKey: string) => {
      // Selected if: (in library AND not marked for removal) OR marked for addition
      // But we don't track "in library" state here, so we check the Sets
      // Item is selected if it's in itemsToAdd OR not in itemsToRemove
      // Wait, this logic needs to consider the item's actual library state...
      // Actually, the `selected` prop already handles `addedToLibrary`, so we just need to check our Sets
      return itemsToAdd.has(itemKey) || itemsToRemove.has(itemKey);
    },
    [itemsToAdd, itemsToRemove]
  );

  const {
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    onSetFilters,
    searchQuery,
    setSearchQuery,
  } = useCommonSearch({ mode });

  const onCloseModalAndReset = useMemoizedFn(() => {
    setTimeout(() => {
      setItemsToAdd(new Set());
      setItemsToRemove(new Set());
      setSearchQuery('');
      onSetFilters.setSelectedAssets(null);
      onSetFilters.setSelectedDateRange(null);
    }, 300);
    onCloseLibrarySearchStore();
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
    scrollConfig: {
      scrollThreshold: 55,
    },
  });

  console.log(
    'allResults',
    allResults.filter((result) => result.addedToLibrary)
  );

  const onSubmit = useMemoizedFn(() => {
    // Parse composite keys back to { assetId, assetType } objects
    const assetsToAddParsed = Array.from(itemsToAdd).map((key) => parseSelectionKey(key));
    const assetsToRemoveParsed = Array.from(itemsToRemove).map((key) => parseSelectionKey(key));

    // Execute both operations
    if (assetsToAddParsed.length > 0) {
      postLibraryAssets(assetsToAddParsed);
    }

    if (assetsToRemoveParsed.length > 0) {
      removeLibraryAssets(assetsToRemoveParsed);
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
