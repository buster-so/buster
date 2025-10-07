import type { AssetType } from '@buster/server-shared/assets';
import React, { useMemo, useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import { useDebounce } from '@/hooks/useDebounce';
import { GlobalSearchModalBase } from './GlobalSearchModalBase';
import { useGlobalSearchStore } from './global-search-store';

export const GlobalSearchModal = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<AssetType[] | null>(null);
  const { isOpen } = useGlobalSearchStore();

  const debouncedSearchQuery = useDebounce(searchQuery, { wait: 100 });

  const hasQuery = searchQuery.length > 0;
  const openSecondaryContent = hasQuery;

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
    page_size: 20,
    assetTypes,
    searchQuery: debouncedSearchQuery,
    includeAssetAncestors: true,
    includeScreenshots: true,
    scrollConfig: {
      scrollThreshold: 10,
    },
    mounted: isOpen,
  });

  return (
    <GlobalSearchModalBase
      value={searchQuery}
      items={allResults}
      onChangeValue={setSearchQuery}
      loading={isLoading}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={openSecondaryContent}
      selectedAssets={selectedAssets}
    />
  );
};
