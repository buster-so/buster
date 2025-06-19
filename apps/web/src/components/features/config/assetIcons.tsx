import { ShareAssetType } from '@/api/asset_interfaces/share';
import { Folder5, FolderPlus, Grid, GridPlus, Messages, SquareChart } from '@/components/ui/icons';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const ASSET_ICONS = {
  metrics: SquareChart,
  chats: Messages,
  dashboards: Grid,
  collections: Folder5,
  dashboardAdd: GridPlus,
  collectionAdd: FolderPlus
};

export const assetTypeToIcon = (assetType: ShareAssetType) => {
  switch (assetType) {
    case ShareAssetType.METRIC:
      return ASSET_ICONS.metrics;
    case ShareAssetType.DASHBOARD:
      return ASSET_ICONS.dashboards;
    case ShareAssetType.COLLECTION:
      return ASSET_ICONS.collections;
    case ShareAssetType.CHAT:
      return ASSET_ICONS.chats;
    default: {
      const _result: never = assetType;
      return ASSET_ICONS.metrics;
    }
  }
};

export const assetTypeToRoute = (assetType: ShareAssetType, assetId: string) => {
  switch (assetType) {
    case ShareAssetType.METRIC:
      return createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId: assetId });
    case ShareAssetType.DASHBOARD:
      return createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: assetId });
    case ShareAssetType.COLLECTION:
      return createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS_ID, collectionId: assetId });
    case ShareAssetType.CHAT:
      return createBusterRoute({ route: BusterRoutes.APP_CHAT_ID, chatId: assetId });
    default:
      console.warn('Asset type to route not found', assetType, assetId);
      return '';
  }
};
