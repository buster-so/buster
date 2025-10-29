import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import { useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  Dropdown,
  type DropdownProps,
  type IDropdownItem,
} from '@/components/ui/dropdown';
import { Plus } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { NewCollectionModal } from '../modals/NewCollectionModal';

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
      onRemoveFromCollection,
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
        items={items}
      >
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
  onRemoveFromCollection,
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
  const navigate = useNavigate();
  const [openCollectionModal, setOpenCollectionModal] = useState(false);

  const { data: collectionsListResponse, isPending: isCreatingCollection } = useGetCollectionsList(
    {}
  );
  const collectionsList = collectionsListResponse?.data || [];

  const items: DropdownProps['items'] = useMemo(() => {
    const collectionsItems = (collectionsList || []).map<IDropdownItem>((collection) => {
      return createDropdownItem({
        value: collection.id,
        label: collection.name,
        selected: selectedCollections.some((id) => id === collection.id),
        onClick: () => onClickItem(collection),
        link: {
          to: '/app/collections/$collectionId',
          params: {
            collectionId: collection.id,
          },
        },
      });
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
        onClick={onOpenNewCollectionModal}
      >
        New collection
      </Button>
    );
  }, [onOpenNewCollectionModal]);

  const onCollectionCreated = useMemoizedFn(async (collectionId: string) => {
    await onSaveToCollection([collectionId]);
    navigate({
      to: '/app/collections/$collectionId',
      params: {
        collectionId,
      },
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
      ),
    };
  }, [
    items,
    menuHeader,
    footerContent,
    openCollectionModal,
    onCloseCollectionModal,
    onCollectionCreated,
  ]);
};
