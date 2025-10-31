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

  if (asset_type === 'metric_file') {
    return <LibraryItemMetricContextMenu {...props}>{children}</LibraryItemMetricContextMenu>;
  }
  if (asset_type === 'dashboard_file') {
    return <LibraryItemDashboardContextMenu {...props}>{children}</LibraryItemDashboardContextMenu>;
  }
  if (asset_type === 'report_file') {
    return <LibraryItemReportContextMenu {...props}>{children}</LibraryItemReportContextMenu>;
  }
  if (asset_type === 'collection') {
    return (
      <LibraryItemCollectionContextMenu {...props}>{children}</LibraryItemCollectionContextMenu>
    );
  }
  if (asset_type === 'chat') {
    return <LibraryItemChatContextMenu {...props}>{children}</LibraryItemChatContextMenu>;
  }

  const _exhaustiveCheck: never = asset_type;

  return children;
};

const LibraryItemMetricContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
}) => {
  const items = useMetricLibraryItems(asset_id);
  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const LibraryItemDashboardContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
}) => {
  const items = useDashboardLibraryItems(asset_id);
  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const LibraryItemReportContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
}) => {
  const items = useReportLibraryItems(asset_id);
  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const LibraryItemCollectionContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
}) => {
  const items = useCollectionLibraryItems(asset_id);
  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const LibraryItemChatContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
}) => {
  const items = useChatLibraryItems(asset_id);
  return <ContextMenu items={items}>{children}</ContextMenu>;
};

const SelectedContextMenuRecord: Record<
  AssetType,
  React.FC<React.PropsWithChildren<LibraryAssetListItem>>
> = {
  metric_file: LibraryItemMetricContextMenu,
  dashboard_file: LibraryItemDashboardContextMenu,
  report_file: LibraryItemReportContextMenu,
  collection: LibraryItemCollectionContextMenu,
  chat: LibraryItemChatContextMenu,
};
