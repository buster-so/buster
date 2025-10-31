import React from 'react';
import { AssetListViewList } from '@/components/features/list/AssetList';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps, SharedWithMeViewProps } from '../library.types';

export const LibraryListView = React.memo(
  ({
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
        type={type}
      />
    );
  }
);

LibraryListView.displayName = 'LibraryListView';
