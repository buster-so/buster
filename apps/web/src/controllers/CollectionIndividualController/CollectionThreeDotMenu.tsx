import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import {
  useCollectionShareMenuSelectMenu,
  useFavoriteCollectionSelectMenu,
} from '@/components/features/collections/threeDotMenuHooks';
import { Button } from '@/components/ui/buttons';
import { createDropdownDivider, Dropdown } from '@/components/ui/dropdown';
import { Dots, Pencil, Trash } from '@/components/ui/icons';
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
  ({ id, name, isEditor, isEffectiveOwner, setOpenAddTypeModal, isAddedToLibrary }) => {
    const navigate = useNavigate();
    const { mutateAsync: deleteCollection, isPending: isDeletingCollection } =
      useDeleteCollection();

    const favoriteCollection = useFavoriteCollectionSelectMenu({ collectionId: id });
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const shareMenu = useCollectionShareMenuSelectMenu({ collectionId: id });

    const items = useMemo(
      () =>
        createMenuItems(
          [
            shareMenu,
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
      [id, shareMenu, favoriteCollection, setIsRenameModalOpen, isAddedToLibrary]
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
