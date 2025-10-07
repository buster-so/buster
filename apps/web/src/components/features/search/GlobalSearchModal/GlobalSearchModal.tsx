import type { AssetType } from '@buster/server-shared/assets';
import React, { useMemo, useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import { GlobalSearchModalBase } from './GlobalSearchModalBase';

export const GlobalSearchModal = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<AssetType[] | null>(null);

  const hasQuery = searchQuery.length > 0;
  const openSecondaryContent = true;

  const assetTypes: AssetType[] | undefined = useMemo(() => {
    if (selectedAssets) {
      return selectedAssets;
    }
    if (!hasQuery) {
      return ['chat'];
    }
    return;
  }, [selectedAssets, hasQuery]);

  const { allResults, isLoading, scrollContainerRef } = useSearchInfinite({
    page_size: 15,
    assetTypes,
    searchQuery,
    includeAssetAncestors: true,
    includeScreenshots: true,
    scrollConfig: {
      scrollThreshold: 60,
    },
  });

  return (
    <GlobalSearchModalBase
      value={searchQuery}
      items={allResults}
      onChangeValue={setSearchQuery}
      loading={isLoading}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={openSecondaryContent}
    />
  );
};
