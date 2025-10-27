import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React, { useMemo } from 'react';
import { type AssetListItem, AssetListViewList } from '@/components/features/list/AssetList';
import {
  type BusterListRow,
  type BusterListSectionRow,
  createListItem,
} from '@/components/ui/list/BusterListNew';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps, SharedWithMeViewProps } from '../library.types';

const createLibraryListItem = createListItem<AssetListItem>();

export const LibraryListView = ({
  allResults,
  filters,
  isFetchingNextPage,
  scrollContainerRef,
  allGroups,
  isInitialLoading,
  pinCollectionsToTop,
  type,
}: LibraryViewProps | SharedWithMeViewProps) => {
  const { group_by } = filters;

  const {
    prelistItems,
    mainItems,
  }: {
    prelistItems: BusterListRow<AssetListItem>[];
    mainItems: LibraryAssetListItem[];
  } = useMemo(() => {
    if (!pinCollectionsToTop) {
      return {
        prelistItems: [],
        mainItems: allResults,
      };
    }

    const prelistItems: BusterListRow<AssetListItem>[] = [];
    const mainItems: LibraryAssetListItem[] = [];

    for (const result of allResults) {
      if (result.asset_type === 'collection') {
        prelistItems.push(
          createLibraryListItem({
            type: 'row',
            id: result.asset_id,
            data: { ...result, asset_id: result.asset_id, asset_type: 'collection' as const },
            link: {
              to: '/app/collections/$collectionId',
              params: {
                collectionId: result.asset_id,
              },
            },
          })
        );
        continue;
      }
      mainItems.push(result);
    }

    if (prelistItems.length > 0) {
      prelistItems.unshift({
        type: 'section',
        id: 'collections',
        title: 'Collections',
        secondaryTitle: String(prelistItems.length),
      } satisfies BusterListSectionRow);
    }

    return {
      prelistItems,
      mainItems,
    };
  }, [allResults, pinCollectionsToTop]);

  return (
    <AssetListViewList
      items={mainItems}
      groupBy={group_by}
      groups={allGroups}
      prelistItems={prelistItems}
      isFetchingNextPage={isFetchingNextPage}
      scrollContainerRef={scrollContainerRef}
      emptyContent={<LibraryEmptyView type={type} />}
      ContextMenu={LibraryItemContextMenu}
      isInitialLoading={isInitialLoading}
    />
  );
};
