import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollection } from '@buster/server-shared/collections';
import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { IBusterChat } from '@/api/asset_interfaces/chat';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import type { ApiError } from '@/api/errors';
import { getAssetSelectedQuery } from './getAssetSelectedQuery';

// Union of all possible return types
type AssetData =
  | IBusterChat
  | BusterMetric
  | GetDashboardResponse
  | GetReportResponse
  | BusterCollection;

// Function overloads for each asset type
export function useGetAssetSelected<TData>(
  params: {
    type: 'chat' | 'reasoning';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<IBusterChat, ApiError, TData>, 'queryKey' | 'queryFn'>
): ReturnType<typeof useQuery<IBusterChat, ApiError, TData>>;

export function useGetAssetSelected<TData>(
  params: {
    type: 'metric_file';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<BusterMetric, ApiError, TData>, 'queryKey' | 'queryFn'>
): ReturnType<typeof useQuery<BusterMetric, ApiError, TData>>;

export function useGetAssetSelected<TData>(
  params: {
    type: 'dashboard_file';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<GetDashboardResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
): ReturnType<typeof useQuery<GetDashboardResponse, ApiError, TData>>;

export function useGetAssetSelected<TData>(
  params: {
    type: 'report_file';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<GetReportResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
): ReturnType<typeof useQuery<GetReportResponse, ApiError, TData>>;

export function useGetAssetSelected<TData>(
  params: {
    type: 'collection';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Omit<UseQueryOptions<BusterCollection, ApiError, TData>, 'queryKey' | 'queryFn'>
): ReturnType<typeof useQuery<BusterCollection, ApiError, TData>>;

// Implementation signature (accepts all types)
export function useGetAssetSelected<TData>(
  params: {
    type: AssetType | 'reasoning';
    assetId: string;
    chosenVersionNumber: number | 'LATEST';
  },
  options?: Record<string, unknown>
) {
  const selectedQuery = getAssetSelectedQuery(
    params.type,
    params.assetId,
    params.chosenVersionNumber
  );

  return useQuery({
    queryKey: selectedQuery.queryKey,
    ...options,
  });
}
