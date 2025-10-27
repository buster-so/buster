import isEmpty from 'lodash/isEmpty';
import { useMemo } from 'react';
import type { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { computeLibraryFilters } from './compute-library-filters';
import type { LibrarySearchParams, SharedWithMeSearchParams } from './schema';

export const useManagedFilters = (
  filtersProps: LibrarySearchParams | SharedWithMeSearchParams
): Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> => {
  const user = useGetUserBasicInfo();
  const userId = user?.id ?? '';
  return useMemo(() => computeLibraryFilters(filtersProps, userId), [filtersProps, userId]);
};

export const useHasFiltersEnabled = (
  filtersProps: LibrarySearchParams | SharedWithMeSearchParams
) => {
  return useMemo(() => {
    return !isEmpty(filtersProps) && Object.values(filtersProps).some(Boolean);
  }, [filtersProps]);
};
