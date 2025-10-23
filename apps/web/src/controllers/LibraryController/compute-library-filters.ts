import type { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import type { LibrarySearchParams } from './schema';

export const computeLibraryFilters = (filtersProps: LibrarySearchParams, userId: string) => {
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
  const filters: Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> = {
    page_size: 45,
  };

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
};
