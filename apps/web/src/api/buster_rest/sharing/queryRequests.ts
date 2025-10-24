import type { AssetListItem, GetAssetsRequestQuery } from '@buster/server-shared/library';
import { keepPreviousData, type QueryClient, useQuery } from '@tanstack/react-query';
import { useInfiniteScroll } from '@/api/query-helpers';
import { sharingQueryKeys } from '@/api/query_keys/sharing';
import { getSharingAssets } from './requests';

const DEFAULT_PAGE_SIZE = 100;

export const useGetSharingAssets = (filters: GetAssetsRequestQuery) => {
  return useQuery({
    ...sharingQueryKeys.sharingGetList(filters),
    queryFn: () => getSharingAssets(filters),
  });
};

export const useSharingAssetsInfinite = ({
  scrollConfig,
  mounted = true,
  enabled = true,
  page_size = DEFAULT_PAGE_SIZE,
  ...params
}: Omit<GetAssetsRequestQuery, 'page' | 'page_size'> & {
  page_size?: number;
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
  mounted?: boolean;
  enabled?: boolean;
}) => {
  return useInfiniteScroll<AssetListItem>({
    ...sharingQueryKeys.sharingGetListInfinite(params),
    queryFn: ({ pageParam = 1 }) => {
      return getSharingAssets({ ...params, page_size, page: pageParam });
    },
    placeholderData: keepPreviousData,
    scrollConfig,
    mounted,
    enabled,
  });
};

export const prefetchGetSharingAssets = async (
  queryClient: QueryClient,
  filters: GetAssetsRequestQuery
) => {
  await queryClient.prefetchQuery({
    ...sharingQueryKeys.sharingGetList(filters),
    queryFn: () => getSharingAssets(filters),
  });
};

export const prefetchGetSharingAssetsInfinite = async (
  queryClient: QueryClient,
  filters: Omit<GetAssetsRequestQuery, 'page' | 'page_size'> & {
    page_size?: number;
  }
) => {
  await queryClient.prefetchInfiniteQuery({
    ...sharingQueryKeys.sharingGetListInfinite(filters),
    queryFn: () =>
      getSharingAssets({ ...filters, page_size: filters.page_size ?? DEFAULT_PAGE_SIZE, page: 1 }),
    initialPageParam: 1,
  });
};
