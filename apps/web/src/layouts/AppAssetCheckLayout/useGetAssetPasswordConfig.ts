import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';
import { type QueryKey, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { ApiError } from '@/api/errors';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { reportsQueryKeys } from '@/api/query_keys/reports';

interface AssetAccess {
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  isDeleted: boolean;
  isFetched: boolean;
}

export const getAssetAccess = (
  error: ApiError | null,
  isFetched: boolean,
  selectedQuery: QueryKey,
  hasData: boolean
): AssetAccess => {
  if (error) {
    console.error('Error in getAssetAccess', error, isFetched, selectedQuery, hasData);
  }

  // 418 is password required
  if (error?.status === 418) {
    return {
      hasAccess: false,
      passwordRequired: true,
      isPublic: true,
      isDeleted: false,
      isFetched: true,
    };
  }

  // 410 is deleted
  if (error?.status === 410) {
    return {
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: true,
      isFetched: true,
    };
  }

  // 403 is no access
  if (error?.status === 403) {
    return {
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: true,
    };
  }

  if (typeof error?.status === 'number') {
    return {
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched,
    };
  }

  return {
    hasAccess: true,
    passwordRequired: false,
    isPublic: false,
    isDeleted: false,
    isFetched,
  };
};

export const useGetAssetPasswordConfig = (
  assetId: string,
  type: AssetType | ResponseMessageFileType,
  versionNumber: number | undefined
) => {
  const chosenVersionNumber = versionNumber || 'LATEST';

  const selectedQuery = useMemo(
    () => getSelectedQuery(type, assetId, chosenVersionNumber),
    [type, assetId, chosenVersionNumber]
  );

  const { error, isFetched, data } = useQuery({
    queryKey: selectedQuery.queryKey,
    enabled: true,
    select: (v: unknown) => !!v,
  });

  return getAssetAccess(error, isFetched, selectedQuery.queryKey, !!data);
};

export const getSelectedQuery = (
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
