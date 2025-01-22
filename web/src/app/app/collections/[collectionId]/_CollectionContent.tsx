'use client';

import { useCollectionsContextSelector, useIndividualCollection } from '@/context/Collections';
import React, { useMemo, useRef, useState } from 'react';
import { AppMaterialIcons, BusterUserAvatar } from '@/components';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { formatDate } from '@/utils';
import {
  BusterCollection,
  BusterCollectionItemAsset,
  BusterCollectionListItem
} from '@/api/buster_rest/collection';
import { Text } from '@/components';
import { ListEmptyState } from '../../_components/Lists/ListEmptyState';
import { AddTypeModal } from '../../_components/AddTypeModal';
import { BusterShareAssetType } from '@/api/buster_rest';
import { useMemoizedFn, useSize, useUnmount } from 'ahooks';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/list';
import { CollectionIndividualSelectedPopup } from './_CollectionsIndividualPopup';

export const CollectionContent: React.FC<{}> = () => {
  const unsubscribeToGetCollection = useCollectionsContextSelector(
    (x) => x.unsubscribeToGetCollection
  );
  const openedCollectionId = useCollectionsContextSelector((x) => x.openedCollectionId);
  const openAddTypeModal = useCollectionsContextSelector((x) => x.openAddTypeModal);
  const setOpenAddTypeModal = useCollectionsContextSelector((x) => x.setOpenAddTypeModal);
  const { collection } = useIndividualCollection({ collectionId: openedCollectionId });
  const loadedAsset = collection?.id;

  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  if (!loadedAsset) {
    return <CollectionListSkeleton />;
  }

  const assetList = collection?.assets || [];

  return (
    <>
      <CollectionList
        assetList={assetList}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
        selectedCollection={collection}
        loadedAsset={loadedAsset}
      />

      <AddTypeModal
        open={openAddTypeModal}
        onClose={onCloseModal}
        type="collection"
        collection={collection}
      />
    </>
  );
};

const columns: BusterListColumn[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: ({ asset_type, name }) => {
      const Icon = CollectionIconRecord[asset_type];
      return (
        <div className="flex w-full items-center space-x-2 overflow-hidden">
          {Icon}
          <Text type="secondary" ellipsis>
            {name}
          </Text>
        </div>
      );
    }
  },
  {
    dataIndex: 'updated_at',
    title: 'Last edited',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' })
  },
  {
    dataIndex: 'created_by',
    title: 'Owner',
    width: 50,
    render: (created_by: BusterCollectionListItem['owner']) => {
      return (
        <BusterUserAvatar
          image={created_by?.avatar_url || undefined}
          name={created_by?.name}
          size={18}
        />
      );
    }
  }
];

const CollectionList: React.FC<{
  assetList: BusterCollectionItemAsset[];
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (value: boolean) => void;
  selectedCollection: BusterCollection;
  loadedAsset: string;
}> = ({ setOpenAddTypeModal, selectedCollection, assetList, loadedAsset }) => {
  const onBulkAddRemoveToCollection = useCollectionsContextSelector(
    (x) => x.onBulkAddRemoveToCollection
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const items: BusterListRow[] = useMemo(() => {
    return assetList.map((asset) => ({
      id: asset.id,
      link: createAssetLink(asset, selectedCollection.id),
      data: {
        ...asset,
        name: { name: asset.name || 'New ' + asset.asset_type, asset_type: asset.asset_type }
      }
    }));
  }, [assetList]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  const onDeleteClick = useMemoizedFn(async () => {
    const assets = assetList
      .filter((v) => !selectedRowKeys.includes(v.id))
      .map((v) => ({
        type: v.asset_type,
        id: v.id
      }));

    await onBulkAddRemoveToCollection({
      collectionId: selectedCollection.id,
      assets
    });
    setSelectedRowKeys([]);
  });

  return (
    <div className="relative flex h-full flex-col items-center">
      <BusterList
        rows={items}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          loadedAsset ? (
            <ListEmptyState
              title="You haven’t saved anything to your collection yet."
              buttonText="Add to collection"
              description="As soon as you add metrics and dashboards to your collection, they will appear here."
              onClick={() => {
                setOpenAddTypeModal(true);
              }}
            />
          ) : (
            <></>
          )
        }
      />

      <CollectionIndividualSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        onDeleteClick={onDeleteClick}
      />
    </div>
  );
};

const CollectionIconRecord: Record<string, React.ReactNode> = {
  thread: <AppMaterialIcons icon="monitoring" />,
  dashboard: <AppMaterialIcons icon="grid_view" />,
  metric: <AppMaterialIcons icon="monitoring" />
};

const CollectionListSkeleton: React.FC<{}> = () => {
  return null;
};

const createAssetLink = (asset: BusterCollectionItemAsset, collectionId: string) => {
  if (asset.asset_type === BusterShareAssetType.THREAD) {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID_THREADS_ID,
      collectionId,
      threadId: asset.id
    });
  }

  if (asset.asset_type === 'dashboard') {
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: asset.id
    });
  }

  if (asset.asset_type === 'collection') {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS
    });
  }

  return '#';
};
