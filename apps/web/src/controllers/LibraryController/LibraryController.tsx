import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo } from 'react';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { FilterLibraryPills } from '@/components/features/search/FilterPills';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { LibraryGridView } from './LibraryGridView';
import { LibraryHeader } from './LibraryHeader';
import { LibraryListView } from './LibraryListView';
import type { LibraryViewProps } from './library.types';
import type { LibraryLayout, LibrarySearchParams } from './schema';
import { useHasFiltersEnabled, useManagedFilters } from './useManagedFilters';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({ filters, layout }) => {
  const managedFilters = useManagedFilters(filters);
  const hasFiltersEnabled = useHasFiltersEnabled(filters);

  const { scrollContainerRef, allResults, allGroups, isFetchingNextPage, isFetched } =
    useLibraryAssetsInfinite(managedFilters);

  const libraryViewProps: LibraryViewProps = {
    allResults,
    allGroups,
    filters,
    isFetchingNextPage,
    scrollContainerRef,
    isInitialLoading: !isFetched,
    useCollections: !hasFiltersEnabled,
  };

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filters} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      <FilterLibraryPills {...managedFilters} filter={filters.filter} />

      {layout === 'grid' && <LibraryGridView {...libraryViewProps} />}
      {layout === 'list' && <LibraryListView {...libraryViewProps} />}
    </AppPageLayout>
  );
};
