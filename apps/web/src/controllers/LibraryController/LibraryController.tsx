import type React from 'react';
import { useMemo } from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { LibraryGridView } from './LibraryGridView';
import { LibraryHeader } from './LibraryHeader';
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

  const { scrollContainerRef, allResults, isFetchingNextPage } = useLibraryAssetsInfinite({
    ...managedFilters,
    page_size: 45,
    scrollConfig: {
      scrollThreshold: 125,
    },
  });

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filtersProps} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      {layout === 'grid' && (
        <LibraryGridView
          allResults={allResults}
          collections={collections}
          filters={filtersProps}
          isFetchingNextPage={isFetchingNextPage}
          scrollContainerRef={scrollContainerRef}
        />
      )}
      {layout === 'list' && <span>asdf</span>}
    </AppPageLayout>
  );
};

const useManagedFilters = (
  filtersProps: LibrarySearchParams
): Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig' | 'page_size'> => {
  const user = useGetUserBasicInfo();
  const userId = user?.id ?? '';

  return useMemo(() => {
    const {
      asset_types,
      ordering,
      ordering_direction,
      start_date,
      end_date,
      owner_ids,
      filter,
      q,
      layout,
      group_by,
      ...rest
    } = filtersProps;
    const filters: Omit<
      Parameters<typeof useLibraryAssetsInfinite>[0],
      'scrollConfig' | 'page_size'
    > = {};

    if (filter === 'all') {
      filters.includeCreatedBy = owner_ids;
    } else if (filter === 'owned_by_me') {
      filters.includeCreatedBy = [userId];
    } else if (filter === 'shared_with_me') {
      filters.excludeCreatedBy = [userId];
    } else {
      const _exhaustiveCheck: undefined = filter;
    }

    if (asset_types) {
      filters.assetTypes = asset_types.filter((type) => type !== 'collection');
    }

    if (ordering) {
      filters.ordering = ordering;
    }

    if (start_date) {
      filters.startDate = start_date;
    }
    if (end_date) {
      filters.endDate = end_date;
    }
    if (group_by) {
      filters.groupBy = group_by;
    }
    if (q) {
      filters.query = q;
    }
    if (ordering_direction) {
      filters.orderingDirection = ordering_direction;
    }
    if (owner_ids?.length) {
      if (filters.includeCreatedBy?.length) {
        filters.includeCreatedBy = [...filters.includeCreatedBy, ...owner_ids];
      } else {
        filters.includeCreatedBy = owner_ids;
      }
      filters.includeCreatedBy = owner_ids;
    }

    // biome-ignore lint/complexity/noBannedTypes: This is a temporary fix to satisfy the linter
    const _exhaustiveCheck: {} = rest;

    return filters;
  }, [filtersProps, userId]);
};
