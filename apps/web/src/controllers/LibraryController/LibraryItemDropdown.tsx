import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { useDeleteLibraryAssets } from '@/api/buster_rest/library';
import { ContextMenu } from '@/components/ui/context-menu';
import { Trash } from '@/components/ui/icons';
import { useLibraryItemDropdown } from './useLibraryItemDropdown';

export const LibraryItemContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
  asset_type,
}) => {
  const items = useLibraryItemDropdown({ asset_id, asset_type });

  return <ContextMenu items={items}>{children}</ContextMenu>;
};
