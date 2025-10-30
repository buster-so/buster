import type { BusterCollection } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import React, {} from 'react';
import { ShareCollectionButton } from '@/components/features/buttons/ShareMenuCollectionButton';
import { AssetOrderPopover } from '@/components/features/list/AssetList';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { CollectionThreeDotDropdown } from './CollectionThreeDotMenu';

export const CollectionsIndividualHeader: React.FC<{
  setOpenAddTypeModal: (open: boolean) => void;
  collection: BusterCollection | undefined;
  isFetched: boolean;
  layout: 'grid' | 'list';
}> = ({ setOpenAddTypeModal, layout, collection }) => {
  const collectionTitle = collection?.name || '';

  return (
    <>
      <div className="flex h-full items-center space-x-3 overflow-hidden">
        <Breadcrumb items={[{ label: collectionTitle }]} />
      </div>

      {collection && canEdit(collection.permission) && (
        <ContentRight
          collection={collection}
          setOpenAddTypeModal={setOpenAddTypeModal}
          layout={layout}
        />
      )}
    </>
  );
};

const ContentRight: React.FC<{
  collection: BusterCollection;
  layout: 'grid' | 'list';
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, setOpenAddTypeModal }) => {
  const collectionTitle = collection?.name;
  const navigate = useNavigate();

  const isEditor = canEdit(collection.permission);
  const isEffectiveOwner = getIsEffectiveOwner(collection.permission);

  const onButtonClick = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
  });

  const onChangeLayout = useMemoizedFn((layout: 'grid' | 'list') => {
    navigate({
      to: '/app/collections/$collectionId',
      params: { collectionId: collection.id },
      search: { layout },
    });
  });

  return (
    <div className="flex items-center space-x-1">
      {isEditor && (
        <AppTooltip title={'Add to collection'}>
          <Button variant={'ghost'} prefix={<Plus />} onClick={onButtonClick} />
        </AppTooltip>
      )}
      {isEffectiveOwner && <ShareCollectionButton collectionId={collection.id} />}
      {/* <AssetOrderPopover
        layout={layout}
        onChangeLayout={onChangeLayout}
        showDirection={false}
        showGroupBy={false}
        showOrdering={false}
      /> */}
      <CollectionThreeDotDropdown
        id={collection.id}
        name={collectionTitle}
        isEffectiveOwner={isEffectiveOwner}
        isEditor={isEditor}
        collection={collection}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
    </div>
  );
});
ContentRight.displayName = 'ContentRight';
