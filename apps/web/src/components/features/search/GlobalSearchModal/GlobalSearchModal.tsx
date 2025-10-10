import type { AssetType } from '@buster/server-shared/assets';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import { useDebounce } from '@/hooks/useDebounce';
import { GlobalSearchModalBase } from './GlobalSearchModalBase';
import { useGlobalSearchStore } from './global-search-store';

export const GlobalSearchModal = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<AssetType[] | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);
  const { isOpen } = useGlobalSearchStore();

  const debouncedSearchQuery = useDebounce(searchQuery, { wait: 100 });
  const hasQuery = searchQuery.length > 0;
  const openSecondaryContent = hasQuery;

  const onSetFilters: OnSetFiltersParams = useMemo(
    () => ({
      setSelectedAssets,
      setSelectedDateRange,
    }),
    [setSelectedAssets, setSelectedDateRange]
  );

  const filtersParams: FiltersParams = useMemo(
    () => ({
      selectedAssets,
      selectedDateRange,
    }),
    [selectedAssets, selectedDateRange]
  );

  const assetTypes: AssetType[] | undefined = useMemo(() => {
    if (selectedAssets?.length) {
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
    startDate: selectedDateRange?.from?.toISOString(),
    endDate: selectedDateRange?.to?.toISOString(),
    searchQuery: debouncedSearchQuery,
    includeAssetAncestors: true,
    includeScreenshots: true,
    scrollConfig: {
      scrollThreshold: 55,
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
      onSetFilters={onSetFilters}
      filtersParams={filtersParams}
    />
  );
};

export type OnSetFiltersParams = {
  setSelectedAssets: React.Dispatch<React.SetStateAction<AssetType[] | null>>;
  setSelectedDateRange: React.Dispatch<
    React.SetStateAction<{
      from: Date;
      to: Date;
    } | null>
  >;
};

export type FiltersParams = {
  selectedAssets: AssetType[] | null;
  selectedDateRange: {
    from: Date;
    to: Date;
  } | null;
};
