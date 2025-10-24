import type { BusterCollection } from '@buster/server-shared/collections';
import React, {} from 'react';
import { ShareCollectionButton } from '@/components/features/buttons/ShareMenuCollectionButton';
import { FavoriteStar } from '@/components/features/favorites';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { canEdit } from '@/lib/share';
import { CollectionThreeDotDropdown } from './CollectionThreeDotMenu';

export const CollectionsIndividualHeader: React.FC<{
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
}> = ({ setOpenAddTypeModal, collection, isFetched }) => {
  const collectionTitle = isFetched ? collection?.name || 'No collection title' : '';

  return (
    <>
      <div className="flex h-full items-center space-x-3 overflow-hidden">
        <Breadcrumb items={[{ label: collectionTitle }]} />

        {collection && (
          <div className="flex items-center space-x-3">
            <CollectionThreeDotDropdown
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
    <div className="flex items-center space-x-1">
      <AppTooltip title={'Add to collection'}>
        <Button variant={'ghost'} prefix={<Plus />} onClick={onButtonClick} />
      </AppTooltip>
      <ShareCollectionButton collectionId={collection.id} />
    </div>
  );
});
ContentRight.displayName = 'ContentRight';
