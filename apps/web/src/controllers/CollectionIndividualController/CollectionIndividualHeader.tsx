import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useDeleteCollection, useUpdateCollection } from '@/api/buster_rest/collections';
import { ShareCollectionButton } from '@/components/features/buttons/ShareMenuCollectionButton';
import { FavoriteStar, useFavoriteStar } from '@/components/features/favorites';
import {
  Breadcrumb,
  type BreadcrumbItemType,
  createBreadcrumbItems,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { createDropdownItems, Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Dots, Pencil, Plus, Star, Trash } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { RenameCollectionModal } from './RenameCollectionModal';

export const CollectionsIndividualHeader: React.FC<{
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ setOpenAddTypeModal, collection, isFetched }) => {
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useUpdateCollection();

  const collectionTitle = isFetched ? collection?.name || 'No collection title' : '';

  const onSetTitleValue = useMemoizedFn((value: string) => {
    if (!collection?.id) return;
    updateCollection({
      id: collection.id,
      name: value,
    });
  });

  return (
    <>
      <div className="flex h-full items-center space-x-3 overflow-hidden">
        <CollectionBreadcrumb collectionName={collectionTitle} />

        {collection && (
          <div className="flex items-center space-x-3">
            <ThreeDotDropdown
              id={collection.id}
              name={collectionTitle}
              permission={collection.permission}
            />
            <FavoriteStar
              id={collection.id}
              type={'collection'}
              title={collectionTitle}
              className="opacity-100 group-hover:opacity-100"
            />
          </div>
        )}
      </div>

      {collection && canEdit(collection.permission) && (
        <ContentRight collection={collection} setOpenAddTypeModal={setOpenAddTypeModal} />
      )}
    </>
  );
};

const ContentRight: React.FC<{
  collection: BusterCollection;

  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, setOpenAddTypeModal }) => {
  const onButtonClick = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
  });

  return (
    <div className="flex items-center space-x-2">
      <ShareCollectionButton collectionId={collection.id} />
      <Button prefix={<Plus />} onClick={onButtonClick}>
        Add to collection
      </Button>
    </div>
  );
});
ContentRight.displayName = 'ContentRight';

const ThreeDotDropdown: React.FC<{
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
                    onSuccess: () => {
                      navigate({ to: '/app/collections' });
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
          },
        ].filter((x) => !x.hidden)
      ),
    [id, deleteCollection, isFavorited, onFavoriteClick, setIsRenameModalOpen]
  );

  return (
    <>
      <Dropdown items={items}>
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
ThreeDotDropdown.displayName = 'ThreeDotDropdown';

const CollectionBreadcrumb: React.FC<{
  collectionName: string;
}> = React.memo(({ collectionName }) => {
  const collectionBaseTitle = 'Collections';

  const items: BreadcrumbItemType[] = useMemo(
    () =>
      createBreadcrumbItems([
        {
          label: collectionBaseTitle,
          link: { to: '/app/collections' },
        },
        { label: collectionName },
      ]),
    [collectionBaseTitle, collectionName]
  );

  return <Breadcrumb items={items} />;
});
CollectionBreadcrumb.displayName = 'CollectionBreadcrumb';
