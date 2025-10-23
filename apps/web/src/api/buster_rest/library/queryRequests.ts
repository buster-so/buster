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
  mounted = true,
  enabled = true,
  page_size = 45,
  ...params
}: Omit<GetLibraryAssetsRequestQuery, 'page' | 'page_size'> & {
  page_size?: number;
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
  mounted?: boolean;
  enabled?: boolean;
}) => {
  return useInfiniteScroll<LibraryAssetListItem>({
    queryKey: ['library', 'get', 'list-infinite', params] as const,
    staleTime: 1000 * 40, // 40 seconds
    queryFn: ({ pageParam = 1 }) => {
      return getLibraryAssets({ ...params, page_size, page: pageParam });
    },
    placeholderData: keepPreviousData,
    scrollConfig,
    mounted,
    enabled,
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
