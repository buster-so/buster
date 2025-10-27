import type { LibraryAssetListItem } from '@buster/server-shared/library';
import omit from 'lodash/omit';
import React, { useMemo } from 'react';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { AssetGridSectionContainer, AssetGridViewList } from '@/components/features/list/AssetList';
import { AssetGridCardSmall } from '@/components/features/list/AssetList/AssetGridViewList/AssetGridCardSmall';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps, SharedWithMeViewProps } from '../library.types';

export const LibraryGridView = React.memo(
  ({
    allResults,
    isFetchingNextPage,
    isInitialLoading: isInitialLoadingProp,
    className,
    filters,
    scrollContainerRef,
    allGroups,
    type,
    pinCollections,
  }: LibraryViewProps | SharedWithMeViewProps) => {
    const useCollectionsView = pinCollections && allGroups?.collection;

    const prelistContent = useMemo(() => {
      if (pinCollections && allGroups?.collection) {
        return <LibraryCollectionGrid items={allGroups.collection} />;
      }
      return undefined;
    }, [useCollectionsView, allGroups?.collection]);

    const groups = useMemo(() => {
      if (pinCollections) {
        return omit(allGroups, 'collection');
      }
      return allGroups;
    }, [useCollectionsView, allGroups]);

    return (
      <AssetGridViewList
        items={allResults}
        groups={groups}
        ContextMenu={LibraryItemContextMenu}
        isFetchingNextPage={isFetchingNextPage}
        isInitialLoading={isInitialLoadingProp}
        scrollContainerRef={scrollContainerRef}
        emptyContent={<LibraryEmptyView type={type} />}
        groupBy={filters.group_by}
        className={className}
        prelistContent={prelistContent}
      />
    );
  }
);

export const LibraryCollectionGrid = React.memo(({ items }: { items: LibraryAssetListItem[] }) => {
  return (
    <AssetGridSectionContainer title="Collections" icon={<ASSET_ICONS.collections />}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-4">
        {items.map((collection) => (
          <AssetGridCardSmall key={collection.asset_id} {...collection} />
        ))}
      </div>
    </AssetGridSectionContainer>
  );
});

LibraryCollectionGrid.displayName = 'LibraryCollectionGrid';
