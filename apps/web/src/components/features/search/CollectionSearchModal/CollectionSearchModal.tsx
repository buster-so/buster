import React from 'react';
import {
  useAddAssetToCollection,
  useGetCollection,
  useRemoveAssetFromCollection,
} from '@/api/buster_rest/collections';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type {
  SearchModalContentProps,
  SearchMode,
} from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { parseSelectionKey, SearchModalBase } from '../SearchModalBase';
import { useCommonSearch } from '../useCommonSearch';
import { useSearchMultiSelect } from '../useSearchMultiSelect';
import { useCollectionSearchStore } from './collection-search-store';

const mode: SearchMode = 'select-multiple';

export const CollectionSearchModal = React.memo(({ collectionId }: { collectionId: string }) => {
  const { isOpen, onCloseCollectionSearch } = useCollectionSearchStore();
  const { data: collection } = useGetCollection(collectionId);

  const { mutateAsync: addAssetToCollection, isPending: isAddingAssetToCollection } =
    useAddAssetToCollection(true);
  const { mutateAsync: removeAssetFromCollection, isPending: isRemovingAssetFromCollection } =
    useRemoveAssetFromCollection(true);

  const {
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    onSetFilters,
    searchQuery,
    setSearchQuery,
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
    onCloseModal: onCloseCollectionSearch,
    ...onSetFilters,
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
    const collectionId = collection?.id;
    if (!collectionId) return;
    await Promise.all([
      itemsToAdd.size > 0 &&
        addAssetToCollection({
          id: collectionId,
          assets: Array.from(itemsToAdd).map((key) => {
            const { assetId, assetType } = parseSelectionKey(key);
            return { id: assetId, type: assetType };
          }),
        }),
      itemsToRemove.size > 0 &&
        removeAssetFromCollection({
          id: collectionId,
          assets: Array.from(itemsToRemove).map((key) => {
            const { assetId, assetType } = parseSelectionKey(key);
            return { id: assetId, type: assetType };
          }),
        }),
    ]);
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
        children: 'Update collection',
        variant: 'default',
        loading: isAddingAssetToCollection || isRemovingAssetFromCollection,
        onClick: onSubmit,
      },
    }),
    [
      itemsToAdd.size,
      itemsToRemove.size,
      onCloseModalAndReset,
      isAddingAssetToCollection,
      isRemovingAssetFromCollection,
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
CollectionSearchModal.displayName = 'CollectionSearchModal';
