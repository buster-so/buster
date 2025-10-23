import type {
  GetLibraryAssetsRequestQuery,
  LibraryAssetListItem,
} from '@buster/server-shared/library';
import { keepPreviousData, type QueryClient, useQuery } from '@tanstack/react-query';
import { libraryQueryKeys } from '@/api/query_keys/library';
import { useInfiniteScroll } from '@/api/query-helpers';
import { getLibraryAssets } from './requests';

export const useGetLibraryAssets = (filters: GetLibraryAssetsRequestQuery) => {
  return useQuery({
    ...libraryQueryKeys.libraryGetList(filters),
    queryFn: () => getLibraryAssets(filters),
  });
};

export const useLibraryAssetsInfinite = ({
  scrollConfig,
  ...params
}: Omit<GetLibraryAssetsRequestQuery, 'page'> & {
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
}) => {
  return useInfiniteScroll<LibraryAssetListItem>({
    queryKey: ['library', 'get', 'list-infinite', params] as const,
    staleTime: 1000 * 40, // 40 seconds
    queryFn: ({ pageParam = 1 }) => {
      return getLibraryAssets({ ...params, page: pageParam });
    },
    placeholderData: keepPreviousData,
    scrollConfig,
  });
};

export const prefetchGetLibraryAssets = async (
  queryClient: QueryClient,
  filters: GetLibraryAssetsRequestQuery
) => {
  await queryClient.prefetchQuery({
    ...libraryQueryKeys.libraryGetList(filters),
    queryFn: () => getLibraryAssets(filters),
  });
};

export const prefetchGetLibraryAssetsInfinite = async (
  queryClient: QueryClient,
  filters: Omit<GetLibraryAssetsRequestQuery, 'page'>
) => {
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['library', 'get', 'list-infinite', filters] as const,
    queryFn: () => getLibraryAssets({ ...filters, page: 1 }),
    initialPageParam: 1,
  });
};
