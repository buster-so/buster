import type React from 'react';
import { useMemo } from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { computeLibraryFilters } from './compute-library-filters';
import { LibraryGridView } from './LibraryGridView';
import { LibraryHeader } from './LibraryHeader';
import { LibraryListView } from './LibraryListView';
import type { LibraryViewProps } from './library.types';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({
  filters: filtersProps,
  layout,
}) => {
  const { data: collections } = useGetCollectionsList({});
  const managedFilters = useManagedFilters(filtersProps);

  const { scrollContainerRef, allResults, allGroups, isFetchingNextPage, isFetched } =
    useLibraryAssetsInfinite({
      ...managedFilters,
      scrollConfig: {
        scrollThreshold: 125,
      },
    });

  const libraryViewProps: LibraryViewProps = {
    allResults,
    allGroups,
    collections: collections?.data || [],
    filters: filtersProps,
    isFetchingNextPage,
    scrollContainerRef,
    isInitialLoading: isFetched,
  };

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filtersProps} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      {layout === 'grid' && <LibraryGridView {...libraryViewProps} />}
      {layout === 'list' && <LibraryListView {...libraryViewProps} />}
    </AppPageLayout>
  );
};

const useManagedFilters = (
  filtersProps: LibrarySearchParams
): Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> => {
  const user = useGetUserBasicInfo();
  const userId = user?.id ?? '';
  return useMemo(() => computeLibraryFilters(filtersProps, userId), [filtersProps, userId]);
};
