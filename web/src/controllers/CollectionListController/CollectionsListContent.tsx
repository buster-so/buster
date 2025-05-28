'use client';

import React, { useMemo, useState } from 'react';
import { AppPageLayoutContent } from '@/components/ui/layouts/AppPageLayoutContent';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, makeHumanReadble } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRow,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';
import { NewCollectionModal } from '@/components/features/modal/NewCollectionModal';
import { type BusterCollectionListItem, ShareAssetType } from '@/api/asset_interfaces';
import { CollectionListSelectedPopup } from './CollectionListSelectedPopup';
import { Text } from '@/components/ui/typography';
import { FavoriteStar } from '@/components/features/list';

export const CollectionsListContent: React.FC<{
  openNewCollectionModal: boolean;
  setOpenNewCollectionModal: (open: boolean) => void;
  isCollectionListFetched: boolean;
  collectionsList: BusterCollectionListItem[];
}> = React.memo(
  ({
    openNewCollectionModal,
    setOpenNewCollectionModal,
    isCollectionListFetched,
    collectionsList
  }) => {
    const onCloseNewCollectionModal = useMemoizedFn(() => {
      setOpenNewCollectionModal(false);
    });

    return (
      <>
        <CollectionList
          collectionsList={collectionsList}
          setOpenNewCollectionModal={setOpenNewCollectionModal}
          loadedCollections={isCollectionListFetched}
        />

        <NewCollectionModal
          open={openNewCollectionModal}
          onClose={onCloseNewCollectionModal}
          useChangePage={true}
        />
      </>
    );
  }
);
CollectionsListContent.displayName = 'CollectionsListContent';

const columns: BusterListColumn[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (v, { id, ...rest }: BusterCollectionListItem) => {
      return (
        <div className="mr-2 flex items-center space-x-1.5">
          <Text truncate>{v}</Text>
          <FavoriteStar
            id={id}
            type={ShareAssetType.COLLECTION}
            iconStyle="tertiary"
            title={v}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      );
    }
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 150,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'sharing',
    title: 'Sharing',
    width: 55,
    render: (v) => makeHumanReadble(v || 'private')
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 50,
    render: (owner: BusterCollectionListItem['owner']) => {
      return <Avatar image={owner?.avatar_url || undefined} name={owner?.name} size={18} />;
    }
  }
];

const CollectionList: React.FC<{
  collectionsList: BusterCollectionListItem[];
  setOpenNewCollectionModal: (v: boolean) => void;
  loadedCollections: boolean;
}> = React.memo(({ collectionsList, setOpenNewCollectionModal, loadedCollections }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const collections: BusterListRow[] = useMemo(() => {
    return collectionsList.map((collection) => {
      return {
        id: collection.id,
        link: createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: collection.id
        }),
        data: collection
      };
    });
  }, [collectionsList]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  const onOpenNewCollectionModal = useMemoizedFn(() => {
    setOpenNewCollectionModal(true);
  });

  return (
    <div className="relative flex h-full flex-col items-center">
      <BusterList
        rows={collections}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          loadedCollections ? (
            <ListEmptyStateWithButton
              title="You don’t have any collections yet."
              buttonText="Create a collection"
              description="Collections help you organize your metrics and dashboards. Collections will appear here."
              onClick={onOpenNewCollectionModal}
            />
          ) : (
            <></>
          )
        }
      />

      <CollectionListSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
      />
    </div>
  );
});
CollectionList.displayName = 'CollectionList';
