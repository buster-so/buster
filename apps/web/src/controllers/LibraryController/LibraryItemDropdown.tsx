import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { ContextMenu } from '@/components/ui/context-menu';
import { useLibraryItemDropdown } from './useLibraryItemDropdown';

export const LibraryItemContextMenu: React.FC<
  React.PropsWithChildren<
    LibraryAssetListItem & { open?: boolean; onOpenChange?: (open: boolean) => void }
  >
> = ({ children, asset_id, asset_type, open, onOpenChange }) => {
  const items = useLibraryItemDropdown({ asset_id, asset_type });

  return (
    <ContextMenu items={items} open={open} onOpenChange={onOpenChange}>
      {children}
    </ContextMenu>
  );
};
