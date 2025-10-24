import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useFavoriteStar } from '@/components/features/favorites';
import { Button } from '@/components/ui/buttons';
import { createDropdownItems, Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Dots, Pencil, Star, Trash } from '@/components/ui/icons';
import { StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { RenameCollectionModal } from './RenameCollectionModal';

export const CollectionThreeDotDropdown: React.FC<{
  id: string;
  name: string;
  permission: BusterCollection['permission'];
}> = React.memo(({ id, name, permission }) => {
  const navigate = useNavigate();
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id,
    type: 'collection',
    name: name || '',
  });
  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const items: IDropdownItems = useMemo(
    () =>
      createDropdownItems(
        [
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
          {
            value: 'favorite',
            label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
            icon: isFavorited ? <StarFilled /> : <Star />,
            onClick: () => onFavoriteClick(),
            closeOnSelect: false,
          },
        ].filter((x) => !x.hidden)
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
