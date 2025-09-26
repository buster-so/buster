import type { AssetType } from '@buster/server-shared';
import type { ShareAssetType } from '@buster/server-shared/share';
import type { JSX } from 'react';
import {
  FileContent,
  Folder5,
  FolderPlus,
  Grid,
  GridPlus,
  Messages,
  SquareChart,
  Table,
} from '@/components/ui/icons';
import SquareChartPlus from '@/components/ui/icons/NucleoIconOutlined/square-chart-plus';

export const ASSET_ICONS = {
  metrics: SquareChart,
  metircsAdd: SquareChartPlus,
  chats: Messages,
  dashboards: Grid,
  collections: Folder5,
  dashboardAdd: GridPlus,
  collectionAdd: FolderPlus,
  table: Table,
  reports: FileContent,
};

export const assetTypeToIcon = (assetType: ShareAssetType) => {
  switch (assetType) {
    case 'metric_file':
      return ASSET_ICONS.metrics;
    case 'dashboard_file':
      return ASSET_ICONS.dashboards;
    case 'collection':
      return ASSET_ICONS.collections;
    case 'chat':
      return ASSET_ICONS.chats;
    case 'report_file':
      return ASSET_ICONS.reports;
    default: {
      const _result: never = assetType;
      console.warn('Asset type to icon not found', assetType);
      return ASSET_ICONS.metrics;
    }
  }
};
