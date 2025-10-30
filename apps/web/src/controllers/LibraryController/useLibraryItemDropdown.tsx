import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { useMemo } from 'react';
import { useDeleteLibraryAssets } from '@/api/buster_rest/library';
import { Trash } from '@/components/ui/icons';
import { createMenuItems, type MenuItems } from '@/components/ui/menu-shared';

export const useLibraryItemDropdown = ({
  asset_id,
  asset_type,
}: Pick<LibraryAssetListItem, 'asset_id' | 'asset_type'>): MenuItems => {
  const { mutateAsync: onDeleteLibraryAsset, isPending: isDeletingLibraryAsset } =
    useDeleteLibraryAssets();

  return useMemo(() => {
    return createMenuItems([
      {
        type: 'item',
        value: 'remove-from-library',
        label: 'Remove from library',
        icon: <Trash />,
        loading: isDeletingLibraryAsset,
        onClick: () => onDeleteLibraryAsset([{ assetId: asset_id, assetType: asset_type }]),
      },
    ]);
  }, [asset_id, asset_type, onDeleteLibraryAsset, isDeletingLibraryAsset]);
};
