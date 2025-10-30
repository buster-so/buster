import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollection } from '@buster/server-shared/collections';
import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { IBusterChat } from '@/api/asset_interfaces/chat';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import type { ApiError } from '@/api/errors';
import { getAssetSelectedQuery } from './getAssetSelectedQuery';

// Type mapping for each asset type to its return type
type AssetTypeToData = {
  chat: IBusterChat;
  reasoning: IBusterChat;
  metric_file: BusterMetric;
  dashboard_file: GetDashboardResponse;
  report_file: GetReportResponse;
  collection: BusterCollection;
};

// Union of all possible return types
type AssetData =
  | IBusterChat
  | BusterMetric
  | GetDashboardResponse
  | GetReportResponse
  | BusterCollection;

// Generic function that infers the correct return type based on the asset type
export function useGetAsset<
  T extends AssetType | 'reasoning',
  TData = AssetTypeToData[T & keyof AssetTypeToData],
>(
  params: {
    type: T;
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<
    UseQueryOptions<AssetTypeToData[T & keyof AssetTypeToData], ApiError, TData>,
    'queryKey' | 'queryFn'
  >
) {
  const selectedQuery = getAssetSelectedQuery(
    params.type,
    params.assetId,
    params.chosenVersionNumber
  );

  return useQuery<AssetTypeToData[T & keyof AssetTypeToData], ApiError, TData>({
    queryKey: selectedQuery.queryKey,
    ...options,
  });
}
