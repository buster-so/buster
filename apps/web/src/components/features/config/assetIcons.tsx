import { ShareAssetType } from '@buster/server-shared/share';
import {
  Folder5,
  FolderPlus,
  Grid,
  GridPlus,
  Messages,
  SquareChart,
  Table,
  FileText
} from '@/components/ui/icons';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const ASSET_ICONS = {
  metrics: SquareChart,
  chats: Messages,
  dashboards: Grid,
  collections: Folder5,
  dashboardAdd: GridPlus,
  collectionAdd: FolderPlus,
  table: Table,
  reports: FileText
};

export const assetTypeToIcon = (assetType: ShareAssetType) => {
  switch (assetType) {
    case 'metric':
      return ASSET_ICONS.metrics;
    case 'dashboard':
      return ASSET_ICONS.dashboards;
    case 'collection':
      return ASSET_ICONS.collections;
    case 'chat':
      return ASSET_ICONS.chats;
    case 'report':
      return ASSET_ICONS.reports;
    default: {
      const _result: never = assetType;
      return ASSET_ICONS.metrics;
    }
  }
};

export const assetTypeToRoute = (assetType: ShareAssetType, assetId: string) => {
  switch (assetType) {
    case 'metric':
      return createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: assetId });
    case 'dashboard':
      return createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: assetId });
    case 'collection':
      return createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS_ID, collectionId: assetId });
    case 'chat':
      return createBusterRoute({ route: BusterRoutes.APP_CHAT_ID, chatId: assetId });
    default:
      console.warn('Asset type to route not found', assetType, assetId);
      return '';
  }
};
