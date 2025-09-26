import type { AssetType } from '@buster/server-shared/assets';
import type { ResponseMessageFileType } from '@buster/server-shared/chats';

export const getAssetIdAndVersionNumber = (
  assetType: AssetType | ResponseMessageFileType,
  params: {
    chatId?: string;
    dashboardId?: string;
    metricId?: string;
    reportId?: string;
    collectionId?: string;
    messageId?: string;
  },
  search: {
    metric_version_number?: number;
    dashboard_version_number?: number;
    report_version_number?: number;
  }
): {
  assetId: string;
  versionNumber: number | undefined;
} => {
  if (assetType === 'chat') {
    return { assetId: params.chatId ?? '', versionNumber: undefined };
  }
  if (assetType === 'dashboard_file') {
    return { assetId: params.dashboardId ?? '', versionNumber: search.dashboard_version_number };
  }
  if (assetType === 'metric_file') {
    return { assetId: params.metricId ?? '', versionNumber: search.metric_version_number };
  }
  if (assetType === 'report_file') {
    return { assetId: params.reportId ?? '', versionNumber: search.report_version_number };
  }
  if (assetType === 'collection') {
    return { assetId: params.collectionId ?? '', versionNumber: undefined };
  }
  if (assetType === 'reasoning') {
    return { assetId: params.messageId ?? '', versionNumber: undefined };
  }
  const _exhaustiveCheck: never = assetType;
  return { assetId: '', versionNumber: undefined };
};
