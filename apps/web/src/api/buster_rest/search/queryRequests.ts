import type { SearchTextData, SearchTextResponse } from '@buster/server-shared/search';
import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
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

export const useSearchInfinite = ({
  enabled,
  mounted,
  scrollConfig,
  ...params
}: Pick<
  Parameters<typeof search>[0],
  | 'page_size'
  | 'assetTypes'
  | 'includeAssetAncestors'
  | 'includeScreenshots'
  | 'endDate'
  | 'startDate'
  | 'query'
> & {
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
  enabled?: boolean;
  mounted?: boolean;
}) => {
  return useInfiniteScroll<SearchTextData>({
    queryKey: ['search', 'results', 'infinite', params] as const,
    staleTime: 1000 * 40, // 40 seconds
    queryFn: ({ pageParam = 1 }) => search({ page: pageParam, ...params }),
    placeholderData: keepPreviousData,
    enabled,
    scrollConfig,
    mounted,
  });
};
