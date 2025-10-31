import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useFavoriteCollectionSelectMenu } from '@/components/features/collections/threeDotMenuHooks';
import { useAddToLibraryCollection } from '@/components/features/library/useAddToLibraryCollection';
import { ShareMenuContent } from '@/components/features/ShareMenu';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownDivider,
  createDropdownItems,
  Dropdown,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Dots, Pencil, Trash } from '@/components/ui/icons';
import { ShareRight } from '@/components/ui/icons/NucleoIconOutlined';
import SquareChartPlus from '@/components/ui/icons/NucleoIconOutlined/square-chart-plus';
import { createMenuItems } from '@/components/ui/menu-shared';
import { RenameCollectionModal } from './RenameCollectionModal';

export const CollectionThreeDotDropdown: React.FC<{
  id: string;
  name: string;
  isEditor: boolean;
  isEffectiveOwner: boolean;
  collection: BusterCollection;
  setOpenAddTypeModal: (open: boolean) => void;
  isAddedToLibrary: boolean;
}> = React.memo(
  ({ id, name, isEditor, collection, isEffectiveOwner, setOpenAddTypeModal, isAddedToLibrary }) => {
    const navigate = useNavigate();
    const { mutateAsync: deleteCollection, isPending: isDeletingCollection } =
      useDeleteCollection();

    const favoriteCollection = useFavoriteCollectionSelectMenu({ collectionId: id });
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

    const items = useMemo(
      () =>
        createMenuItems(
          [
            {
              value: 'share',
              label: 'Share',
              icon: <ShareRight />,
              hidden: !isEffectiveOwner,
              items: [
                <ShareMenuContent
                  key={id}
                  shareAssetConfig={collection}
                  assetId={id}
                  assetType={'collection'}
                />,
              ],
            },
            favoriteCollection,
            isEditor && {
              value: 'add-to-collection',
              label: 'Add assets',
              icon: <SquareChartPlus />,
              onClick: () => setOpenAddTypeModal(true),
            },
            (isEffectiveOwner || isEditor) && createDropdownDivider(),
            {
              value: 'delete',
              label: 'Delete collection',
              icon: <Trash />,
              onClick: async () => {
                try {
                  await deleteCollection(
                    { id },
                    {
                      onSuccess: (d) => {
                        if (d) navigate({ to: '/app/library' });
                      },
                    }
                  );
                } catch (error) {
                  //
                }
              },
              disabled: isDeletingCollection,
              hidden: !isEffectiveOwner,
            },
            {
              value: 'rename',
              label: 'Rename collection',
              icon: <Pencil />,
              onClick: () => {
                setIsRenameModalOpen(true);
              },
              hidden: !isEditor,
            },
          ].filter((x) => x && !(x as { hidden?: boolean }).hidden)
        ),
      [id, favoriteCollection, setIsRenameModalOpen, isAddedToLibrary]
    );

    return (
      <>
        <Dropdown items={items} align="end" side="bottom">
          <Button variant="ghost" prefix={<Dots />} data-testid="collection-three-dot-dropdown" />
        </Dropdown>
        <RenameCollectionModal
          collectionId={id}
          currentName={name}
          open={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
        />
      </>
    );
  }
);
CollectionThreeDotDropdown.displayName = 'CollectionThreeDotDropdown';
