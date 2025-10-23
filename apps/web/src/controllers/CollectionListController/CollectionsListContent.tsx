import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import React, { useMemo, useState } from 'react';
import { FavoriteStar } from '@/components/features/favorites';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator';
import { NewCollectionModal } from '@/components/features/modals/NewCollectionModal';
import { Avatar } from '@/components/ui/avatar';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  ListEmptyStateWithButton,
} from '@/components/ui/list';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { makeHumanReadble } from '@/lib/text';
import { CollectionListSelectedPopup } from './CollectionListSelectedPopup';

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
    collectionsList,
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

const columns: BusterListColumn<BusterCollectionListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (v, { id }: BusterCollectionListItem) => {
      return (
        <div className="mr-2 flex items-center space-x-1.5">
          <Text truncate>{v}</Text>
          <FavoriteStar
            id={id}
            type={'collection'}
            iconStyle="tertiary"
            title={v}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      );
    },
  },
  {
    dataIndex: 'updated_at',
    title: 'Last edited',
    width: 150,
    render: (v) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'is_shared',
    title: 'Sharing',
    width: 65,
    render: (v) => getShareStatus({ is_shared: v }),
  },
  {
    dataIndex: 'created_by_avatar_url',
    title: 'Owner',
    width: 50,
    render: (_v, record: BusterCollectionListItem) => {
      return (
        <Avatar
          image={record.created_by_avatar_url || undefined}
          name={record.created_by_name || undefined}
          size={18}
        />
      );
    },
  },
];

const CollectionList: React.FC<{
  collectionsList: BusterCollectionListItem[];
  setOpenNewCollectionModal: (v: boolean) => void;
  loadedCollections: boolean;
}> = React.memo(({ collectionsList, setOpenNewCollectionModal, loadedCollections }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const collections: BusterListRowItem<BusterCollectionListItem>[] = useMemo(() => {
    const createCollectionLinkItem = createListItem<BusterCollectionListItem>();

    return collectionsList.map((collection) => {
      return createCollectionLinkItem({
        id: collection.id,
        link: {
          to: '/app/collections/$collectionId',
          params: {
            collectionId: collection.id,
          },
        },
        data: collection,
      });
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
          ) : null
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
