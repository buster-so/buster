import type { SearchTextRequest, SearchTextResponse } from '@buster/server-shared/search';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export const getSearchResult = (params: SearchTextRequest) =>
  queryOptions<SearchTextResponse>({
    queryKey: ['search', 'results', params] as const,
    staleTime: 1000 * 30, // 30 seconds,
  });

export const searchQueryKeys = {
  getSearchResult,
  getSearchResultInfinite: (params: Partial<SearchTextRequest>) => ({
    queryKey: ['search', 'results', 'infinite', params] as const,
    staleTime: 1000 * 30, // 30 seconds,
  }),
};
