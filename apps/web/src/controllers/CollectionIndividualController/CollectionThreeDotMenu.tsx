import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useFavoriteStar } from '@/components/features/favorites';
import { ShareMenuContent } from '@/components/features/ShareMenu';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownDivider,
  createDropdownItems,
  Dropdown,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Dots, Pencil, Star, Trash } from '@/components/ui/icons';
import { StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { ShareRight } from '@/components/ui/icons/NucleoIconOutlined';
import SquareChartPlus from '@/components/ui/icons/NucleoIconOutlined/square-chart-plus';
import { RenameCollectionModal } from './RenameCollectionModal';

export const CollectionThreeDotDropdown: React.FC<{
  id: string;
  name: string;
  isEditor: boolean;
  isEffectiveOwner: boolean;
  collection: BusterCollection;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ id, name, isEditor, collection, isEffectiveOwner, setOpenAddTypeModal }) => {
  const navigate = useNavigate();
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id,
    type: 'collection',
    name: name || '',
  });
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const items: IDropdownItems = useMemo(
    () =>
      createDropdownItems(
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

          {
            value: 'favorite',
            label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
            icon: isFavorited ? <StarFilled /> : <Star />,
            onClick: () => onFavoriteClick(),
            closeOnSelect: false,
          },
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
    [id, deleteCollection, isFavorited, onFavoriteClick, setIsRenameModalOpen]
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
});
CollectionThreeDotDropdown.displayName = 'CollectionThreeDotDropdown';
