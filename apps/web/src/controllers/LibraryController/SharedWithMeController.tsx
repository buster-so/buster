import React from 'react';
import { useSharingAssetsInfinite } from '@/api/buster_rest/sharing';
import type { SharedWithMeViewProps } from './library.types';
import type { SharedWithMeLayout, SharedWithMeSearchParams } from './schema';
import { useHasFiltersEnabled, useManagedFilters } from './useManagedFilters';

export type SharedWithMeControllerProps = {
  filters: SharedWithMeSearchParams;
  layout: SharedWithMeLayout;
};

export const SharedWithMeController: React.FC<SharedWithMeControllerProps> = ({
  filters,
  layout,
}) => {
  const managedFilters = useManagedFilters(filters);
  const hasFiltersEnabled = useHasFiltersEnabled(filters);

  const { scrollContainerRef, allResults, allGroups, isFetchingNextPage, isFetched } =
    useSharingAssetsInfinite(managedFilters);

  const sharedWithMeViewProps: SharedWithMeViewProps = {
    allResults,
    allGroups,
    filters,
    isFetchingNextPage,
    scrollContainerRef,
    isInitialLoading: !isFetched,
  };

  return <div>SharedWithMeController</div>;
};
