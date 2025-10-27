import type { AssetType } from '@buster/server-shared/assets';
import type { GroupedAssets } from '@buster/server-shared/library';

export const AssetTypeTranslations: Record<AssetType | keyof GroupedAssets, string> = {
  chat: 'Chat',
  dashboard_file: 'Dashboard',
  report_file: 'Report',
  collection: 'Collection',
  metric_file: 'Metric',
  assets: 'Assets',
};

export const assetTypeLabel = (assetType: AssetType | keyof GroupedAssets) => {
  return AssetTypeTranslations[assetType];
};
