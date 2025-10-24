import { useMemo } from 'react';
import { useSearchInfinite } from '@/api/buster_rest/search';
import type { SearchMode } from '@/components/ui/search/SearchModal/search-modal.types';
import { FilterSearchPills } from '../FilterPills';
import { SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useCommonSearch } from '../useCommonSearch';
import { GlobalSearchModalFilters } from './GlobalSearchModalFilters';
import { useGlobalSearchStore } from './global-search-store';

const mode: SearchMode = 'navigate';

export const GlobalSearchModal = () => {
  const { isOpen, onClose } = useGlobalSearchStore();

  const {
    searchQuery,
    setSearchQuery,
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    filtersParams,
    setSelectedAssets,
    setSelectedDateRange,
  } = useCommonSearch({ mode });

  const { allResults, isFetching, scrollContainerRef } = useSearchInfinite({
    page_size: 25,
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
    return (
      <GlobalSearchModalFilters
        {...filtersParams}
        setSelectedAssets={setSelectedAssets}
        setSelectedDateRange={setSelectedDateRange}
      />
    );
  }, [filtersParams, setSelectedAssets, setSelectedDateRange]);

  const filterDropdownContent = useMemo(() => {
    return (
      <FilterSearchPills
        {...filtersParams}
        setSelectedAssets={setSelectedAssets}
        setSelectedDateRange={setSelectedDateRange}
      />
    );
  }, [filtersParams, setSelectedAssets, setSelectedDateRange]);

  return (
    <SearchModalBase
      value={searchQuery}
      items={allResults}
      onChangeValue={setSearchQuery}
      loading={isFetching}
      scrollContainerRef={scrollContainerRef}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      filterContent={filterContent}
      filterDropdownContent={filterDropdownContent}
    />
  );
};
