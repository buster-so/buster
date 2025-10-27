import type React from 'react';
import { useSharingAssetsInfinite } from '@/api/buster_rest/sharing';
import { FilterLibraryPills } from '@/components/features/search/FilterPills';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { LibraryGridView } from './LibraryGridView';
import { LibraryHeader } from './LibraryHeader';
import { LibraryListView } from './LibraryListView';
import type { SharedWithMeViewProps } from './library.types';
import type { SharedWithMeLayout, SharedWithMeSearchParams } from './schema';
import { useHasFiltersEnabled, useManagedFilters } from './useManagedFilters';

export type SharedWithMeControllerProps = {
  filters: SharedWithMeSearchParams;
  layout: SharedWithMeLayout;
};

const type = 'shared-with-me' as const;

export const SharedWithMeController: React.FC<SharedWithMeControllerProps> = ({
  filters,
  layout,
}) => {
  const managedFilters = useManagedFilters({ ...filters, type });

  const { scrollContainerRef, allResults, allGroups, isFetchingNextPage, isFetched } =
    useSharingAssetsInfinite(managedFilters);

  const sharedWithMeViewProps: SharedWithMeViewProps = {
    type,
    allGroups,
    allResults,
    filters,
    isFetchingNextPage,
    scrollContainerRef,
    isInitialLoading: !isFetched,
    pinCollections: false,
  };

  return (
    <AppPageLayout
      header={<LibraryHeader type={type} layout={layout} filters={filters} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      <FilterLibraryPills {...managedFilters} filter={filters.filter} type={type} />

      {layout === 'grid' && <LibraryGridView {...sharedWithMeViewProps} />}
      {layout === 'list' && <LibraryListView {...sharedWithMeViewProps} />}
    </AppPageLayout>
  );
};
