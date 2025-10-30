import omit from 'lodash/omit';
import React, { useMemo } from 'react';
import { AssetGridViewList } from '@/components/features/list/AssetList';
import { LibraryEmptyView } from '../LibraryEmptyView';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibraryViewProps, SharedWithMeViewProps } from '../library.types';
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
    type,
    pinCollections,
  }: LibraryViewProps | SharedWithMeViewProps) => {
    const useCollectionsView = pinCollections && allGroups?.collection;

    const prelistContent = useMemo(() => {
      if (pinCollections && allGroups?.collection?.length) {
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
        type={type}
      />
    );
  }
);
