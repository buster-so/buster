import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React from 'react';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import type { LibrarySearchParams } from './schema';

export const LibraryGridItems = ({ filters }: { filters: LibrarySearchParams }) => {
  const { scrollContainerRef, allResults, isLoading, hasNextPage, isFetchingNextPage } =
    useLibraryAssetsInfinite({
      ...filters,
      page_size: 60,
      scrollConfig: {
        scrollThreshold: 100,
      },
    });

  console.log(allResults);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {allResults.map((asset) => (
        <LibraryGridItem key={asset.asset_id} {...asset} />
      ))}
    </div>
  );
};

const LibraryGridItem = ({ asset_id, asset_type, name, updated_at }: LibraryAssetListItem) => {
  return (
    <div className="border rounded cursor-pointer hover:shadow overflow-hidden">
      <div className="px-2.5 pt-1.5 bg-item-select"></div>
      <div className="px-3 pt-2.5 pb-3"></div>
    </div>
  );
};
