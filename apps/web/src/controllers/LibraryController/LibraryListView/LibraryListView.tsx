import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React, { useMemo } from 'react';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { type AssetListItem, AssetListViewList } from '@/components/features/list/AssetList';
import { Avatar } from '@/components/ui/avatar';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import type {
  BusterListColumn,
  BusterListRow,
  InfiniteScrollConfig,
} from '@/components/ui/list/BusterListNew';
import {
  BusterList,
  type BusterListSectionRow,
  createListItem,
} from '@/components/ui/list/BusterListNew';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps } from '../library.types';

const createLibraryListItem = createListItem<AssetListItem>();

export const LibraryListView = ({
  allResults,
  collections,
  filters,
  isFetchingNextPage,
  scrollContainerRef,
  allGroups,
  isInitialLoading,
}: LibraryViewProps) => {
  const { group_by } = filters;

  const collectionRows: BusterListRow<AssetListItem>[] = useMemo(() => {
    if (collections.length === 0) return [];
    const collectionItems = collections.map((collection) => {
      return createLibraryListItem({
        type: 'row',
        id: collection.id,
        data: { ...collection, asset_id: collection.id, asset_type: 'collection' as const },
        link: {
          to: '/app/collections/$collectionId',
          params: {
            collectionId: collection.id,
          },
        },
      });
    });

    return [
      {
        type: 'section',
        id: 'collections',
        title: 'Collections',
        secondaryTitle: String(collectionItems.length),
      } satisfies BusterListSectionRow,
      ...collectionItems,
    ];
  }, [collections]);

  return (
    <AssetListViewList
      items={allResults}
      groupBy={group_by}
      groups={allGroups}
      prelistItems={collectionRows}
      isFetchingNextPage={isFetchingNextPage}
      scrollContainerRef={scrollContainerRef}
      emptyContent={<LibraryEmptyView />}
      ContextMenu={LibraryItemContextMenu}
      isInitialLoading={isInitialLoading}
    />
  );
};
