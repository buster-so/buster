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
  type,
}: LibraryViewProps | SharedWithMeViewProps) => {
  const { group_by } = filters;

  return (
    <AssetListViewList
      items={allResults}
      groupBy={group_by}
      groups={allGroups}
      isFetchingNextPage={isFetchingNextPage}
      scrollContainerRef={scrollContainerRef}
      emptyContent={<LibraryEmptyView type={type} />}
      ContextMenu={LibraryItemContextMenu}
      isInitialLoading={isInitialLoading}
    />
  );
};
