import {
  type StaticDataRouteOption,
  useMatches,
  useParams,
  useSearch,
} from '@tanstack/react-router';

export const useSelectedAssetType = (): NonNullable<StaticDataRouteOption['assetType']> => {
  const { dashboardId, metricId, reportId, chatId, collectionId, messageId } = useParams({
    strict: false,
  });

  if (metricId) {
    return 'metric_file';
  }

  if (messageId) {
    return 'reasoning';
  }

  if (dashboardId) {
    return 'dashboard_file';
  }

  if (reportId) {
    return 'report_file';
  }

  if (chatId) {
    return 'chat';
  }

  if (collectionId) {
    return 'collection';
  }

  return 'metric_file';
};

export const useSelectedAssetId = () => {
  const { dashboardId, metricId, reportId, chatId, collectionId, messageId } = useParams({
    strict: false,
  });

  if (metricId) {
    return metricId;
  }

  if (messageId) {
    return messageId;
  }

  if (dashboardId) {
    return dashboardId;
  }

  if (reportId) {
    return reportId;
  }

  if (chatId) {
    return chatId;
  }

  if (collectionId) {
    return collectionId;
  }

  return null;
};

export const useGetSelectedAssetId = useSelectedAssetId;

export const useGetSelectedAssetVersionNumber = () => {
  const assetType = useSelectedAssetType();
  const params = useSearch({ strict: false });

  if (assetType === 'dashboard_file') {
    return params?.dashboard_version_number;
  }

  if (assetType === 'metric_file') {
    return params?.metric_version_number;
  }

  if (assetType === 'report_file') {
    return params?.report_version_number;
  }

  if (assetType === 'chat') {
    return;
  }

  if (assetType === 'reasoning') {
    return;
  }

  if (assetType === 'collection') {
    return;
  }

  const _exhaustiveCheck: never = assetType;

  return;
};
