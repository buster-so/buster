import type { BusterSearchResult } from '@/api/asset_interfaces/search';
import { queryOptions } from '@tanstack/react-query';
import type { search } from '../buster_rest/search';

export const getSearchResult = (params: Parameters<typeof search>[0]) =>
  queryOptions<BusterSearchResult[]>({
    queryKey: ['search', 'results', params] as const,
    staleTime: 1000 * 15 // 15 seconds,
  });

export const searchQueryKeys = {
  getSearchResult
};
