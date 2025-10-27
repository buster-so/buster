import React, { useMemo } from 'react';
import { AssetGridSectionContainer, AssetGridViewList } from '@/components/features/list/AssetList';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps } from '../library.types';
import { LibraryCollectionGrid } from './LibraryCollectionGrid';

export const LibraryGridView = React.memo(
  ({
    allResults,
    isFetchingNextPage,
    isInitialLoading: isInitialLoadingProp,
    className,
    filters,
    scrollContainerRef,
    allGroups,
  }: LibraryViewProps) => {
    const prelistContent = useMemo(() => {
      // return (
      //   <AssetGridSectionContainer title="Collections" icon={<Folder />}>
      //     <LibraryCollectionGrid collections={collections} />
      //   </AssetGridSectionContainer>
      // );

      return <></>;
    }, []);

    return (
      <AssetGridViewList
        items={allResults}
        groups={allGroups}
        ContextMenu={LibraryItemContextMenu}
        prelistContent={prelistContent}
        isFetchingNextPage={isFetchingNextPage}
        isInitialLoading={isInitialLoadingProp}
        scrollContainerRef={scrollContainerRef}
        emptyContent={<LibraryEmptyView />}
        groupBy={filters.group_by}
        className={className}
      />
    );
  }
);
