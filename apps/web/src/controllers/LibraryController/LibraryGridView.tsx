import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { LibraryCollectionsScroller } from './LibraryCollectionsScroller';
import { LibraryGridItems } from './LibraryGridItems';
import { LibrarySectionContainer } from './LibrarySectionContainer';
import type { LibrarySearchParams } from './schema';

export const LibraryGridView = React.memo(
  ({
    allResults,
    collections,
    filters,
    isFetchingNextPage,
  }: {
    allResults: LibraryAssetListItem[];
    collections: BusterCollectionListItem[];
    filters: LibrarySearchParams;
    isFetchingNextPage: boolean;
  }) => {
    return (
      <React.Fragment>
        <LibrarySectionContainer title="Collections" icon={<Folder />}>
          <LibraryCollectionsScroller collections={collections} />
        </LibrarySectionContainer>
        <LibrarySectionContainer title="Recently visisted" icon={<Clock />}>
          <LibraryGridItems filters={filters} allResults={allResults} />
        </LibrarySectionContainer>

        {isFetchingNextPage && (
          <div className="text-text-tertiary text-center py-0">Loading more...</div>
        )}
      </React.Fragment>
    );
  }
);
