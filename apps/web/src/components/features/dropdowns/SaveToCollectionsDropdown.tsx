import React, { useMemo, useState } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownItem, type DropdownProps } from '@/components/ui/dropdown';
import { Plus } from '@/components/ui/icons';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { NewCollectionModal } from '../modal/NewCollectionModal';

export const SaveToCollectionsDropdown: React.FC<{
  children: React.ReactNode;
  selectedCollections: string[];
  onSaveToCollection: (collectionId: string[]) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
}> = ({ children, onRemoveFromCollection, onSaveToCollection, selectedCollections }) => {
  const { ModalComponent, selectType, footerContent, menuHeader, items } =
    useSaveToCollectionsDropdownContent({
      selectedCollections,
      onSaveToCollection,
      onRemoveFromCollection
    });

  return (
    <>
      <Dropdown
        side="bottom"
        align="end"
        selectType={selectType}
        menuHeader={menuHeader}
        footerContent={footerContent}
        emptyStateText="No collections found"
        items={items}>
        {children}
      </Dropdown>

      {ModalComponent}
    </>
  );
};

SaveToCollectionsDropdown.displayName = 'SaveToCollectionsDropdown';

export const useSaveToCollectionsDropdownContent = ({
  selectedCollections,
  onSaveToCollection,
  onRemoveFromCollection
}: {
  selectedCollections: string[];
  onSaveToCollection: (collectionId: string[]) => Promise<void>;
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
}): Pick<
  DropdownProps,
  'items' | 'footerContent' | 'menuHeader' | 'selectType' | 'emptyStateText'
> & {
  ModalComponent: React.ReactNode;
} => {
  const [openCollectionModal, setOpenCollectionModal] = useState(false);

  const { data: collectionsList, isPending: isCreatingCollection } = useGetCollectionsList({});
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const items: DropdownProps['items'] = useMemo(() => {
    const collectionsItems = (collectionsList || []).map<DropdownItem>((collection) => {
      return {
        value: collection.id,
        label: collection.name,
        selected: selectedCollections.some((id) => id === collection.id),
        onClick: () => onClickItem(collection),
        link: createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: collection.id
        })
      };
    });
    return collectionsItems;
  }, [collectionsList, selectedCollections]);

  const menuHeader = useMemo(() => {
    return items.length > 0 ? 'Save to a collection' : undefined;
  }, [items.length]);

  const onCloseCollectionModal = useMemoizedFn(() => {
    setOpenCollectionModal(false);
  });

  const onOpenNewCollectionModal = useMemoizedFn(() => {
    setOpenCollectionModal(true);
  });

  const footerContent = useMemo(() => {
    return (
      <Button
        variant="ghost"
        block
        loading={isCreatingCollection}
        className="justify-start!"
        prefix={<Plus />}
        onClick={onOpenNewCollectionModal}>
        New collection
      </Button>
    );
  }, [onOpenNewCollectionModal]);

  const onCollectionCreated = useMemoizedFn(async (collectionId: string) => {
    await onSaveToCollection([collectionId]);
    onChangePage({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId
    });
  });

  const onClickItem = useMemoizedFn((collection: BusterCollectionListItem) => {
    const isSelected = selectedCollections.some((id) => id === collection.id);
    if (isSelected) {
      onRemoveFromCollection(collection.id);
    } else {
      const allCollectionsAndSelected = selectedCollections.map((id) => id).concat(collection.id);
      onSaveToCollection(allCollectionsAndSelected);
    }
  });

  return useMemo(() => {
    return {
      items,
      menuHeader,
      footerContent,
      selectType: 'multiple',
      emptyStateText: 'No collections found',
      ModalComponent: (
        <NewCollectionModal
          open={openCollectionModal}
          onClose={onCloseCollectionModal}
          useChangePage={false}
          onCollectionCreated={onCollectionCreated}
        />
      )
    };
  }, [
    items,
    menuHeader,
    footerContent,
    openCollectionModal,
    onCloseCollectionModal,
    onCollectionCreated
  ]);
};
