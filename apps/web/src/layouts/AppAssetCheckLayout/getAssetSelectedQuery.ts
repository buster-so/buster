import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { useQuery } from '@tanstack/react-query';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { reportsQueryKeys } from '@/api/query_keys/reports';

export const getAssetSelectedQuery = (
  type: AssetType | ResponseMessageFileType,
  assetId: string,
  chosenVersionNumber: number | 'LATEST'
) => {
  if (type === 'metric_file') {
    return metricsQueryKeys.metricsGetMetric(assetId, chosenVersionNumber);
  }
  if (type === 'dashboard_file') {
    return dashboardQueryKeys.dashboardGetDashboard(assetId, chosenVersionNumber);
  }
  if (type === 'report_file') {
    return reportsQueryKeys.reportsGetReport(assetId, chosenVersionNumber);
  }
  if (type === 'collection') {
    return collectionQueryKeys.collectionsGetCollection(assetId);
  }
  if (type === 'reasoning') {
    return chatQueryKeys.chatsGetChat(assetId);
  }

  const _exhaustiveCheck: 'chat' = type;

  return chatQueryKeys.chatsGetChat(assetId);
};

export const useGetAssetSelected = (
  type: AssetType | ResponseMessageFileType,
  assetId: string,
  chosenVersionNumber: number | 'LATEST'
) => {
  const selectedQuery = getAssetSelectedQuery(type, assetId, chosenVersionNumber);

  return useQuery({
    queryKey: selectedQuery.queryKey,
    select: (v: unknown) => !!v,
  });
};
