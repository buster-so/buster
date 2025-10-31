import type { AssetType } from '@buster/server-shared/assets';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { ContextMenu, type ContextMenuProps } from '@/components/ui/context-menu';
import {
  useChatLibraryItems,
  useCollectionLibraryItems,
  useDashboardLibraryItems,
  useMetricLibraryItems,
  useReportLibraryItems,
} from './useLibraryItemDropdown';

export const LibraryItemContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  ...props
}) => {
  const { asset_type } = props;

  const selectedItemsCallback = itemsCallbackRecord[asset_type];

  if (!selectedItemsCallback) {
    return children;
  }

  const items = selectedItemsCallback(props.asset_id);

  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const metricItemeCallback =
  (assetId: string): ContextMenuProps['items'] =>
  ({ MenuContentRenderer }) => {
    const items = useMetricLibraryItems(assetId);
    return <MenuContentRenderer items={items} />;
  };

const dashboardItemeCallback =
  (assetId: string): ContextMenuProps['items'] =>
  ({ MenuContentRenderer }) => {
    const items = useDashboardLibraryItems(assetId);
    return <MenuContentRenderer items={items} />;
  };

const reportItemeCallback =
  (assetId: string): ContextMenuProps['items'] =>
  ({ MenuContentRenderer }) => {
    const items = useReportLibraryItems(assetId);
    return <MenuContentRenderer items={items} />;
  };

const collectionItemeCallback =
  (assetId: string): ContextMenuProps['items'] =>
  ({ MenuContentRenderer }) => {
    const items = useCollectionLibraryItems(assetId);
    return <MenuContentRenderer items={items} />;
  };

const chatItemeCallback =
  (assetId: string): ContextMenuProps['items'] =>
  ({ MenuContentRenderer }) => {
    const items = useChatLibraryItems(assetId);
    return <MenuContentRenderer items={items} />;
  };

const itemsCallbackRecord: Record<AssetType, (assetId: string) => ContextMenuProps['items']> = {
  metric_file: metricItemeCallback,
  dashboard_file: dashboardItemeCallback,
  report_file: reportItemeCallback,
  collection: collectionItemeCallback,
  chat: chatItemeCallback,
};
