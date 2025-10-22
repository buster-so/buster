import type {
  GetLibraryAssetsRequestQuery,
  LibraryGetResponse,
} from '@buster/server-shared/library';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export const libraryQueryKeys = {
  libraryGetList: (filters: GetLibraryAssetsRequestQuery) =>
    queryOptions<LibraryGetResponse>({
      queryKey: ['library', 'get', 'list', filters] as const,
      refetchOnWindowFocus: true,
      staleTime: 3 * 1000, // 3 seconds
    }),
};
