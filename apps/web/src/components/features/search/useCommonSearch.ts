import type { AssetType } from '@buster/server-shared/assets';
import { useMemo, useState } from 'react';
import type { SearchMode } from '@/components/ui/search/SearchModal/search-modal.types';
import { useDebounce } from '@/hooks/useDebounce';

export const useCommonSearch = ({ mode }: { mode: SearchMode }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<AssetType[] | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);

  const hasQuery = searchQuery.length > 0;
  const debouncedSearchQuery = useDebounce(searchQuery, { wait: 100 });

  const assetTypes: AssetType[] | undefined = useMemo(() => {
    if (selectedAssets?.length) {
      return selectedAssets;
    }
    if (!hasQuery && mode === 'navigate') {
      return ['chat'];
    }
    return;
  }, [selectedAssets, hasQuery]);

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

  return {
    searchQuery,
    setSearchQuery,
    selectedDateRange,
    assetTypes,
    debouncedSearchQuery,
    filtersParams,
    onSetFilters,
  };
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
