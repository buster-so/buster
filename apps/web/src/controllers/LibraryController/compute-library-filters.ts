import type { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import type { useSharingAssetsInfinite } from '@/api/buster_rest/sharing';
import type { LibrarySearchParams, SharedWithMeSearchParams } from './schema';

export const computeLibraryFilters = (
  filtersProps: LibrarySearchParams,
  userId: string
): Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> => {
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
  const filters: Omit<Parameters<typeof useLibraryAssetsInfinite>[0], 'scrollConfig'> = {};

  if (filter === 'all') {
    filters.includeCreatedBy = owner_ids;
  } else if (filter === 'owned_by_me') {
    filters.includeCreatedBy = [userId];
  } else if (filter === 'shared_with_me') {
    filters.excludeCreatedBy = [userId];
  } else if (filter === 'collections') {
    const _exhaustiveCheck: undefined = filter;
  }

  if (asset_types) {
    filters.assetTypes = asset_types;
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

  if (!filter && !group_by) {
    filters.pinCollections = true;
  }

  const _exhaustiveCheck: Record<string, never> = rest;

  return filters;
};

export const computeSharedWithMeFilters = (
  filterProps: SharedWithMeSearchParams,
  _userId: string
): Omit<Parameters<typeof useSharingAssetsInfinite>[0], 'scrollConfig'> => {
  const {
    filter,
    q,
    layout,
    group_by,
    ordering,
    ordering_direction,
    start_date,
    end_date,
    owner_ids,
    asset_types,
    ...rest
  } = filterProps;

  const filters: Omit<Parameters<typeof useSharingAssetsInfinite>[0], 'scrollConfig'> = {};

  if (filter === 'all') {
    filters.assetTypes = asset_types?.length ? asset_types : undefined;
  } else if (filter === 'collections') {
    filters.assetTypes = ['collection'];
  } else if (filter === 'assets') {
    filters.assetTypes = asset_types || [];
  } else {
    const _exhaustiveCheck: undefined = filter;
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
    filters.includeCreatedBy = owner_ids;
  }

  const _exhaustiveCheck: Record<string, never> = rest;

  return filters;
};
