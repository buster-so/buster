import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { AssetGridSectionContainer } from '@/components/features/list/AssetList';
import { AssetGridCardSmall } from '@/components/features/list/AssetList/AssetGridViewList/AssetGridCardSmall';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  type ContextMenuItems,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash } from '@/components/ui/icons';

export const LibraryCollectionGrid = React.memo(({ items }: { items: LibraryAssetListItem[] }) => {
  return (
    <AssetGridSectionContainer title="Collections" icon={<ASSET_ICONS.collections />}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-4">
        {items.map((collection) => (
          <AssetGridCardSmall
            key={collection.asset_id}
            {...collection}
            ContextMenu={({ children }) => (
              <CollectionCardContextMenu id={collection.asset_id}>
                {children}
              </CollectionCardContextMenu>
            )}
          />
        ))}
      </div>
    </AssetGridSectionContainer>
  );
});

LibraryCollectionGrid.displayName = 'LibraryCollectionGrid';

const CollectionCardContextMenu = React.memo(
  ({
    id,
    children,
  }: Pick<BusterCollectionListItem, 'id'> & {
    children: React.ReactNode;
  }) => {
    const { mutateAsync: onDeleteCollection } = useDeleteCollection();

    const items: ContextMenuItems = [
      {
        label: 'Delete',
        value: 'delete',
        onClick: () => onDeleteCollection({ id, useConfirmModal: false }),
        icon: <Trash />,
      },
    ];

    return <ContextMenu items={items}>{children}</ContextMenu>;
  }
);
