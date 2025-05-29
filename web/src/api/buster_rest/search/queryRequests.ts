import { searchQueryKeys } from '@/api/query_keys/search';
import { type UseQueryOptions, keepPreviousData, useQuery } from '@tanstack/react-query';
import { search } from './requests';

export const useSearch = (
  params: Parameters<typeof search>[0],
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof search>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...searchQueryKeys.getSearchResult(params),
    queryFn: () => search(params),
    placeholderData: keepPreviousData,
    ...options
  });
};
