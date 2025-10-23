import type { AssetType } from '@buster/server-shared/assets';

export const AssetTypeTranslations: Record<AssetType, string> = {
  chat: 'Chat',
  dashboard_file: 'Dashboard',
  report_file: 'Report',
  collection: 'Collection',
  metric_file: 'Metric',
};
