import type { DatabaseAssetType } from '@buster/database';
import type { ChatAssetType } from '@buster/server-shared/chats';

//TODO - updated the database to avoid this conversion
const chatAssetTypeToDatabaseAssetType: Record<ChatAssetType, DatabaseAssetType> = {
  metric: 'metric_file',
  dashboard: 'dashboard_file',
  report: 'report_file',
};

export const convertChatAssetTypeToDatabaseAssetType = (
  assetType: ChatAssetType
): DatabaseAssetType => {
  return chatAssetTypeToDatabaseAssetType[assetType];
};
