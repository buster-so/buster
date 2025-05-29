'use client';

import React, { useMemo, useState } from 'react';
import { type BusterCollection, ShareAssetType } from '@/api/asset_interfaces';
import { useDeleteCollection, useUpdateCollection } from '@/api/buster_rest/collections';
import { ShareCollectionButton } from '@/components/features/buttons/ShareMenuCollectionButton';
import { FavoriteStar, useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { Breadcrumb, type BreadcrumbItemType } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownItems } from '@/components/ui/dropdown';
import { Dots, Pencil, Plus, Star, Trash } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { BusterRoutes } from '@/routes';
import { RenameCollectionModal } from './RenameCollectionModal';

export const CollectionsIndividualHeader: React.FC<{
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ openAddTypeModal, setOpenAddTypeModal, collection, isFetched }) => {
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useUpdateCollection();

  const collectionTitle = isFetched ? collection?.name || 'No collection title' : '';

  const onSetTitleValue = useMemoizedFn((value: string) => {
    if (!collection?.id) return;
    updateCollection({
      id: collection.id,
      name: value
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
              type={ShareAssetType.COLLECTION}
              title={collectionTitle}
              className="opacity-0 group-hover:opacity-100"
            />
          </div>
        )}
      </div>

      {collection && canEdit(collection.permission) && (
        <ContentRight
          collection={collection}
          openAddTypeModal={openAddTypeModal}
          setOpenAddTypeModal={setOpenAddTypeModal}
        />
      )}
    </>
  );
};

const ContentRight: React.FC<{
  collection: BusterCollection;
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, setOpenAddTypeModal, openAddTypeModal }) => {
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
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id,
    type: ShareAssetType.COLLECTION,
    name: name || ''
  });
  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const items: DropdownItems = useMemo(
    () =>
      [
        {
          value: 'delete',
          label: 'Delete collection',
          icon: <Trash />,
          onClick: async () => {
            try {
              await deleteCollection({ id });
              onChangePage({ route: BusterRoutes.APP_COLLECTIONS });
            } catch (error) {
              //
            }
          },
          disabled: isDeletingCollection,
          hidden: !isEffectiveOwner
        },
        {
          value: 'rename',
          label: 'Rename collection',
          icon: <Pencil />,
          onClick: () => {
            setIsRenameModalOpen(true);
          },
          hidden: !isEditor
        },
        {
          value: 'favorite',
          label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
          icon: isFavorited ? <StarFilled /> : <Star />,
          onClick: onFavoriteClick
        }
      ].filter((x) => !x.hidden),
    [id, deleteCollection, onChangePage, isFavorited, onFavoriteClick, setIsRenameModalOpen]
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
    () => [
      {
        label: collectionBaseTitle,
        route: { route: BusterRoutes.APP_COLLECTIONS }
      },
      { label: collectionName }
    ],
    [collectionBaseTitle, collectionName]
  );

  return <Breadcrumb items={items} />;
});
CollectionBreadcrumb.displayName = 'CollectionBreadcrumb';
