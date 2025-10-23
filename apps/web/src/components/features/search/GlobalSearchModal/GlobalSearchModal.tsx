import type { AssetType } from '@buster/server-shared/assets';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { GlobalSearchModalFilters } from './GlobalSearchModalFilters';
import { useGlobalSearchStore } from './global-search-store';

export const GlobalSearchModal = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<AssetType[] | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);
  const { isOpen, onClose } = useGlobalSearchStore();

  const debouncedSearchQuery = useDebounce(searchQuery, { wait: 100 });
  const hasQuery = searchQuery.length > 0;

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

  const { allResults, isFetching, scrollContainerRef } = useSearchInfinite({
    page_size: 20,
    assetTypes,
    startDate: selectedDateRange?.from?.toISOString(),
    endDate: selectedDateRange?.to?.toISOString(),
    query: debouncedSearchQuery,
    includeAssetAncestors: true,
    includeScreenshots: true,
    scrollConfig: {
      scrollThreshold: 55,
    },
    mounted: isOpen,
  });

  const filterContent = useMemo(() => {
    const hasFilters =
      Object.values(filtersParams).some((x) => !isEmpty(x)) && !isEmpty(searchQuery);
    if (!hasFilters) return null;
    return <GlobalSearchModalFilters {...filtersParams} {...onSetFilters} />;
  }, [filtersParams, onSetFilters]);

  return (
    <SearchModalBase
      value={searchQuery}
      items={allResults}
      onChangeValue={setSearchQuery}
      loading={isFetching}
      scrollContainerRef={scrollContainerRef}
      isOpen={isOpen}
      onClose={onClose}
      mode="navigate"
      filterContent={filterContent}
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
