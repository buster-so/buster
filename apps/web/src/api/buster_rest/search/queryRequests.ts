import type { SearchTextData, SearchTextResponse } from '@buster/server-shared/search';
import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ApiError } from '@/api/errors';
import { searchQueryKeys } from '@/api/query_keys/search';
import { useInfiniteScroll } from '@/api/query-helpers';
import { search } from './requests';

export const useSearch = <T = SearchTextResponse>(
  params: Parameters<typeof search>[0],
  options?: Omit<UseQueryOptions<SearchTextResponse, ApiError, T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SearchTextResponse, ApiError, T>({
    ...searchQueryKeys.getSearchResult(params),
    queryFn: ({ signal }) => search(params, signal),
    select: options?.select,
    ...options,
    placeholderData: keepPreviousData,
  });
};

export const useSearchInfinite = (
  {
    searchQuery,
    ...params
  }: Pick<
    Parameters<typeof search>[0],
    | 'page_size'
    | 'assetTypes'
    | 'includeAssetAncestors'
    | 'includeScreenshots'
    | 'endDate'
    | 'startDate'
  > & {
    scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
    searchQuery: string;
  } = {
    page_size: 5,
    assetTypes: ['chat'],
    searchQuery: '',
  }
) => {
  const queryResult = useInfiniteScroll<SearchTextData>({
    queryKey: ['search', 'results', 'infinite', params] as const,
    staleTime: 1000 * 30, // 30 seconds
    queryFn: ({ pageParam = 1 }) => search({ query: searchQuery, page: pageParam, ...params }),
  });

  return { ...queryResult, searchQuery };
};
