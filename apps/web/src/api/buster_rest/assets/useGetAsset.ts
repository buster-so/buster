import type { AssetType } from '@buster/server-shared/assets';
import type { ChatWithMessages } from '@buster/server-shared/chats';
import type { BusterCollection } from '@buster/server-shared/collections';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { BusterMetric } from '@/api/asset_interfaces/metric';
import type { ApiError } from '@/api/errors';
import { getAssetSelectedQuery } from './getAssetSelectedQuery';

export const useGetAssetSelected = <TData = unknown>(
  {
    type,
    assetId,
    chosenVersionNumber,
  }: {
    type: AssetType;
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<BusterChatMessage, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const selectedQuery = getAssetSelectedQuery(type, assetId, chosenVersionNumber);

  return useQuery({
    queryKey: selectedQuery.queryKey,
    ...options,
  });
};
