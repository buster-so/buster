import type { AssetGetResponse, GetAssetsRequestQuery } from '@buster/server-shared/library';
import { queryOptions } from '@tanstack/react-query';

export const sharingQueryKeys = {
  sharingGetList: (filters: GetAssetsRequestQuery) =>
    queryOptions<AssetGetResponse>({
      queryKey: ['sharing', 'get', 'list', filters] as const,
      refetchOnWindowFocus: true,
      staleTime: 3 * 1000, // 3 seconds
    }),
  sharingGetListInfinite: (filters: Partial<GetAssetsRequestQuery>) => ({
    queryKey: ['sharing', 'get', 'list-infinite', filters] as const,
    staleTime: 1000 * 30, // 30 seconds
  }),
};
