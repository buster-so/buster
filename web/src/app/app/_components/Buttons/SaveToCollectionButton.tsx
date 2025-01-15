import { BusterCollectionListItem } from '@/api/buster-rest/collection';
import { NewCollectionModal } from '@/app/app/collections/_NewCollectionModal';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { AppDropdownSelect } from '@/components/dropdown';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { IBusterThread } from '@/context/Threads/interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { Button } from 'antd';
import React, { useMemo } from 'react';

export const SaveToCollectionsButton: React.FC<{
  disabled?: boolean;
  selectedCollections: IBusterThread['collections'];
  threadId: string;
}> = React.memo(({ disabled, selectedCollections, threadId }) => {
  const getInitialCollections = useCollectionsContextSelector((x) => x.getInitialCollections);
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const unsubscribeToListCollections = useCollectionsContextSelector(
    (x) => x.unsubscribeToListCollections
  );
  const saveThreadToCollection = useBusterThreadsContextSelector(
    (state) => state.saveThreadToCollection
  );
  const removeThreadFromCollection = useBusterThreadsContextSelector(
    (state) => state.removeThreadFromCollection
  );

  const onSaveToCollection = useMemoizedFn(async (collectionId: string[]) => {
    await saveThreadToCollection({ threadId, collectionIds: [...collectionId] });
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    removeThreadFromCollection({ threadId, collectionId });
  });

  const selectedCollectionsIds = useMemo(() => {
    return selectedCollections.map((d) => d.id);
  }, [selectedCollections]);

  const onClick = useMemoizedFn(() => {
    if (!collectionsList.length) getInitialCollections();
  });

  useMount(() => {
    setTimeout(() => {
      if (!collectionsList.length) getInitialCollections();
    }, 7500);
  });

  useUnmount(() => {
    unsubscribeToListCollections();
  });

  return (
    <SaveToCollectionsDropdown
      selectedCollections={selectedCollectionsIds}
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}>
      <Button
        disabled={disabled}
        type="text"
        icon={<AppMaterialIcons icon="note_stack_add" />}
        onClick={onClick}
      />
    </SaveToCollectionsDropdown>
  );
});

SaveToCollectionsButton.displayName = 'SaveToCollectionsButton';

export const SaveToCollectionsDropdown: React.FC<{
  children: React.ReactNode;
  selectedCollections: string[];
  onSaveToCollection: (collectionId: string[]) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
}> = React.memo(({ children, onRemoveFromCollection, onSaveToCollection, selectedCollections }) => {
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const [openCollectionModal, setOpenCollectionModal] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const items = useMemo(
    () =>
      collectionsList.map((collection) => {
        return {
          key: collection.id,
          label: collection.name,
          onClick: () => onClickItem(collection),
          link: createBusterRoute({
            route: BusterRoutes.APP_COLLECTIONS_ID,
            collectionId: collection.id
          })
        };
      }),
    [collectionsList]
  );

  const onClickItem = useMemoizedFn((collection: BusterCollectionListItem) => {
    const isSelected = selectedCollections.some((id) => id === collection.id);
    if (isSelected) {
      onRemoveFromCollection(collection.id);
    } else {
      const allCollectionsAndSelected = selectedCollections.map((id) => id).concat(collection.id);
      onSaveToCollection(allCollectionsAndSelected);
    }
  });

  const onCollectionCreated = useMemoizedFn(async (collectionId: string) => {
    await onSaveToCollection([collectionId]);
    onChangePage({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId
    });
  });

  const onCloseCollectionModal = useMemoizedFn(() => {
    setOpenCollectionModal(false);
    setShowDropdown(false);
  });

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
  });

  const onClick = useMemoizedFn(() => {
    setOpenCollectionModal(true);
    setShowDropdown(false);
  });

  return (
    <>
      <AppDropdownSelect
        trigger={['click']}
        placement="bottomRight"
        className="!flex !h-fit items-center"
        headerContent={'Save to a collection'}
        open={showDropdown}
        onOpenChange={onOpenChange}
        footerContent={
          <Button
            type="text"
            block
            className="!justify-start"
            icon={<AppMaterialIcons icon="add" />}
            onClick={onClick}>
            New collection
          </Button>
        }
        items={items}
        selectedItems={selectedCollections}>
        {showDropdown ? (
          <>{children}</>
        ) : (
          <AppTooltip title={showDropdown ? '' : 'Save to collection'}>{children} </AppTooltip>
        )}
      </AppDropdownSelect>

      <NewCollectionModal
        open={openCollectionModal}
        onClose={onCloseCollectionModal}
        useChangePage={false}
        onCollectionCreated={onCollectionCreated}
      />
    </>
  );
});

SaveToCollectionsDropdown.displayName = 'SaveToCollectionsDropdown';
