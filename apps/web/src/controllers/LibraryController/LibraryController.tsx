import type React from 'react';
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

const type = 'library' as const;

export const LibraryController: React.FC<LibraryControllerProps> = ({ filters, layout }) => {
  const hasFiltersEnabled = useHasFiltersEnabled(filters);
  const managedFilters = useManagedFilters({ ...filters, type: 'library' });

  const pinCollections = !hasFiltersEnabled && !filters.group_by;

  const { scrollContainerRef, allGroups, allResults, isFetchingNextPage, isFetched } =
    useLibraryAssetsInfinite({ ...managedFilters, pinCollections });

  const libraryViewProps: LibraryViewProps = {
    allResults,
    allGroups,
    filters,
    isFetchingNextPage,
    scrollContainerRef,
    isInitialLoading: !isFetched,
    pinCollections,
    type,
  };

  return (
    <AppPageLayout
      header={<LibraryHeader type={type} layout={layout} filters={filters} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      <FilterLibraryPills {...managedFilters} filter={filters.filter} type={type} />

      {layout === 'grid' && <LibraryGridView {...libraryViewProps} />}
      {layout === 'list' && <LibraryListView {...libraryViewProps} />}
    </AppPageLayout>
  );
};
