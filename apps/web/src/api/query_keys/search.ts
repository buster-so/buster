import type { SearchTextRequest, SearchTextResponse } from '@buster/server-shared';
import { queryOptions } from '@tanstack/react-query';

export const getSearchResult = (params: SearchTextRequest) =>
  queryOptions<SearchTextResponse>({
    queryKey: ['search', 'results', params] as const,
    staleTime: 1000 * 15, // 15 seconds,
  });

export const searchQueryKeys = {
  getSearchResult,
};
