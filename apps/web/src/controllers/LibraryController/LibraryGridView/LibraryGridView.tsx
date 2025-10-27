import React from 'react';
import { AssetGridViewList } from '@/components/features/list/AssetList';
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
  }: LibraryViewProps | SharedWithMeViewProps) => {
    return (
      <AssetGridViewList
        items={allResults}
        groups={allGroups}
        ContextMenu={LibraryItemContextMenu}
        isFetchingNextPage={isFetchingNextPage}
        isInitialLoading={isInitialLoadingProp}
        scrollContainerRef={scrollContainerRef}
        emptyContent={<LibraryEmptyView type={type} />}
        groupBy={filters.group_by}
        className={className}
      />
    );
  }
);
