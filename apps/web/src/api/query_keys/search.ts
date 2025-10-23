import type { SearchTextRequest, SearchTextResponse } from '@buster/server-shared/search';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export const getSearchResult = (params: SearchTextRequest) =>
  queryOptions<SearchTextResponse>({
    queryKey: ['search', 'results', params] as const,
    staleTime: 1000 * 30, // 30 seconds,
  });

export const getSearchResultInfinite = () =>
  infiniteQueryOptions<SearchTextResponse>({
    queryKey: ['search', 'results', 'infinite'] as const,
    staleTime: 1000 * 30, // 30 seconds,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) {
        return undefined;
      }
      return lastPage.pagination.page + 1;
    },
    initialPageParam: 1,
  });

export const searchQueryKeys = {
  getSearchResult,
};
