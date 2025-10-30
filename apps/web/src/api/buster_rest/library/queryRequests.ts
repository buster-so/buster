import type {
  GetLibraryAssetsRequestQuery,
  LibraryAssetListItem,
} from '@buster/server-shared/library';
import { keepPreviousData, type QueryClient, useQuery } from '@tanstack/react-query';
import { libraryQueryKeys } from '@/api/query_keys/library';
import { useInfiniteScroll, useInfiniteScrollManual } from '@/api/query-helpers';
import { getLibraryAssets } from './requests';

const DEFAULT_PAGE_SIZE = 100;

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
  page_size = DEFAULT_PAGE_SIZE,
  ...params
}: Omit<GetLibraryAssetsRequestQuery, 'page' | 'page_size'> & {
  page_size?: number;
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
  mounted?: boolean;
  enabled?: boolean;
}) => {
  return useInfiniteScroll<LibraryAssetListItem>({
    ...libraryQueryKeys.libraryGetListInfinite(params),
    queryFn: ({ pageParam = 1 }) => {
      return getLibraryAssets({ ...params, page_size, page: pageParam });
    },
    placeholderData: keepPreviousData,
    scrollConfig,
    mounted,
    enabled,
  });
};

export const useLibraryAssetsInfiniteManual = ({
  mounted = true,
  enabled = true,
  page_size = DEFAULT_PAGE_SIZE,
  ...params
}: Omit<GetLibraryAssetsRequestQuery, 'page' | 'page_size'> & {
  page_size?: number;
  mounted?: boolean;
  enabled?: boolean;
}) => {
  return useInfiniteScrollManual<LibraryAssetListItem>({
    ...libraryQueryKeys.libraryGetListInfinite(params),
    queryFn: ({ pageParam = 1 }) => {
      return getLibraryAssets({ ...params, page_size, page: pageParam });
    },
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
  filters: Omit<GetLibraryAssetsRequestQuery, 'page' | 'page_size'> & {
    page_size?: number;
  }
) => {
  await queryClient.prefetchInfiniteQuery({
    ...libraryQueryKeys.libraryGetListInfinite(filters),
    queryFn: () =>
      getLibraryAssets({ ...filters, page_size: filters.page_size ?? DEFAULT_PAGE_SIZE, page: 1 }),
    initialPageParam: 1,
  });
};
