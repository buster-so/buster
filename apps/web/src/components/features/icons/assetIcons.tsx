import type { GroupedAssets } from '@buster/server-shared/library';
import type { ShareAssetType } from '@buster/server-shared/share';
import {
  FileContent,
  FolderPlus,
  Grid,
  GridPlus,
  Messages,
  SquareChart,
  Table,
} from '@/components/ui/icons';
import FolderContent from '@/components/ui/icons/NucleoIconOutlined/folder-content';
import Folders from '@/components/ui/icons/NucleoIconOutlined/folders';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import SquareChartPlus from '@/components/ui/icons/NucleoIconOutlined/square-chart-plus';

export const ASSET_ICONS = {
  metrics: SquareChart,
  metircsAdd: SquareChartPlus,
  chats: Messages,
  chat: Messages,
  dashboards: Grid,
  dashboard: Grid,
  dashboard_file: Grid,
  collections: FolderContent,
  dashboardAdd: GridPlus,
  collectionAdd: FolderPlus,
  table: Table,
  reports: FileContent,
  report: FileContent,
  report_file: FileContent,
  library: Folders,
};

export const assetTypeToIcon = (assetType: ShareAssetType | keyof GroupedAssets) => {
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
    case 'assets':
      return Grid2;
    default: {
      const _result: never = assetType;
      console.warn('Asset type to icon not found', assetType);
      return ASSET_ICONS.metrics;
    }
  }
};
