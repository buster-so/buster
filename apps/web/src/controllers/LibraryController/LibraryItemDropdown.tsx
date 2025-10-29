import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { useDeleteLibraryAssets } from '@/api/buster_rest/library';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash } from '@/components/ui/icons';

export const LibraryItemContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>> = ({
  children,
  asset_id,
  asset_type,
}) => {
  const { mutateAsync: onDeleteLibraryAsset, isPending } = useDeleteLibraryAssets();

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="p-1 border rounded">
        <ContextMenuItem
          icon={<Trash />}
          onClick={() => onDeleteLibraryAsset([{ assetId: asset_id, assetType: asset_type }])}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
