'use client';

import React, { useMemo, useState } from 'react';
import { AppContent } from '../_components/AppContent';
import { BusterUserAvatar } from '@/components';
import { formatDate, makeHumanReadble } from '@/utils';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { initialFilterOptionKey, useCollectionsContextSelector } from '@/context/Collections';
import {
  BusterList,
  BusterListColumn,
  BusterListRow,
  ListEmptyStateWithButton
} from '@/components/list';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { NewCollectionModal } from './_NewCollectionModal';
import { BusterCollectionListItem } from '@/api/buster_rest/collection';
import { CollectionSelectedPopup } from './_CollectionSelectedPopup';

export const CollectionsListContent: React.FC<{}> = () => {
  const unsubscribeToListCollections = useCollectionsContextSelector(
    (x) => x.unsubscribeToListCollections
  );
  const getInitialCollections = useCollectionsContextSelector((x) => x.getInitialCollections);
  const collectionStatus = useCollectionsContextSelector(
    (x) => x.collectionStatus[initialFilterOptionKey]
  );
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const setOpenNewCollectionModal = useCollectionsContextSelector(
    (x) => x.setOpenNewCollectionModal
  );
  const openNewCollectionModal = useCollectionsContextSelector((x) => x.openNewCollectionModal);

  const onCloseNewCollectionModal = useMemoizedFn(() => {
    setOpenNewCollectionModal(false);
  });

  useMount(() => {
    getInitialCollections();
  });

  useUnmount(() => {
    unsubscribeToListCollections();
  });

  return (
    <>
      <AppContent>
        <CollectionList
          collectionsList={collectionsList}
          setOpenNewCollectionModal={setOpenNewCollectionModal}
          loadedCollections={collectionStatus?.fetched ?? false}
        />
      </AppContent>

      <NewCollectionModal
        open={openNewCollectionModal}
        onClose={onCloseNewCollectionModal}
        useChangePage={true}
      />
    </>
  );
};

const columns: BusterListColumn[] = [
  { dataIndex: 'title', title: 'Title' },
  {
    dataIndex: 'createdAt',
    title: 'Created at',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'lastEdited',
    title: 'Last edited',
    width: 145,
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
      return (
        <BusterUserAvatar image={owner?.avatar_url || undefined} name={owner?.name} size={18} />
      );
    }
  }
];

const CollectionList: React.FC<{
  collectionsList: BusterCollectionListItem[];
  setOpenNewCollectionModal: (v: boolean) => void;
  loadedCollections: boolean;
}> = ({ collectionsList, setOpenNewCollectionModal, loadedCollections }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const collections: BusterListRow[] = useMemo(() => {
    return collectionsList.map((collection) => {
      return {
        id: collection.id,
        link: createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: collection.id
        }),
        data: {
          title: collection.name,
          lastEdited: collection.last_edited,
          createdAt: collection.created_at,
          owner: collection.owner,
          sharing: collection.sharing
        }
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

      <CollectionSelectedPopup selectedRowKeys={selectedRowKeys} onSelectChange={onSelectChange} />
    </div>
  );
};
