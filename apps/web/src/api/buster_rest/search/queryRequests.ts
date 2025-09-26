import type { SearchTextResponse } from '@buster/server-shared/search';
import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { RustApiError } from '@/api/errors';
import { searchQueryKeys } from '@/api/query_keys/search';
import { search } from './requests';

export const useSearch = <T = SearchTextResponse>(
  params: Parameters<typeof search>[0],
  options?: Omit<UseQueryOptions<SearchTextResponse, RustApiError, T>, 'queryKey' | 'queryFn'>,
  postQueryOptions?: {
    doNotUnwrapData?: boolean;
  }
) => {
  const { doNotUnwrapData = false } = postQueryOptions || {};
  return useQuery<SearchTextResponse, RustApiError, T>({
    ...searchQueryKeys.getSearchResult(params),
    queryFn: () => search(params),
    select: options?.select,
    ...options,
    placeholderData: keepPreviousData,
  });
};
