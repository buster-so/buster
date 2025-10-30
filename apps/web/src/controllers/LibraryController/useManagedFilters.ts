import isEmpty from 'lodash/isEmpty';
import { useMemo } from 'react';
import type { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { computeLibraryFilters, computeSharedWithMeFilters } from './compute-library-filters';
import type { LibrarySearchParams, SharedWithMeSearchParams } from './schema';

type LibraryManagedFilters = { type: 'library' } & LibrarySearchParams;
type SharedWithMeManagedFilters = { type: 'shared-with-me' } & SharedWithMeSearchParams;

type ManagedFilters = LibraryManagedFilters | SharedWithMeManagedFilters;

export const useManagedFilters = (
  filtersProps: ManagedFilters
): Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> => {
  const user = useGetUserBasicInfo();
  const userId = user?.id ?? '';
  return useMemo(() => {
    if (filtersProps.type === 'library') {
      return computeLibraryFilters(filtersProps, userId);
    } else {
      return computeSharedWithMeFilters(filtersProps, userId);
    }
  }, [filtersProps, userId]);
};

export const useHasFiltersEnabled = ({
  layout,
  ...filtersProps
}: LibrarySearchParams | SharedWithMeSearchParams) => {
  return useMemo(() => {
    return !isEmpty(filtersProps) && Object.values(filtersProps).some(Boolean);
  }, [filtersProps]);
};
