'use client';

import React, { useMemo, useState } from 'react';
import type { BusterCollection, BusterCollectionItemAsset } from '@/api/asset_interfaces';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { AddToCollectionModal } from '@/components/features/modal/AddToCollectionModal';
import { Avatar } from '@/components/ui/avatar';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRowItem,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import { canEdit } from '@/lib/share';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { CollectionIndividualSelectedPopup } from './CollectionsIndividualPopup';

export const CollectionIndividualContent: React.FC<{
  collection: BusterCollection | undefined;
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, openAddTypeModal, setOpenAddTypeModal }) => {
  const loadedAsset = collection?.id;
  const isEditor = canEdit(collection?.permission);

  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  if (!loadedAsset) {
    return null;
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

      {isEditor && (
        <AddToCollectionModal
          open={openAddTypeModal}
          onClose={onCloseModal}
          collectionId={collection.id}
        />
      )}
    </>
  );
});
CollectionIndividualContent.displayName = 'CollectionIndividualContent';

const columns: BusterListColumn<BusterCollectionItemAsset>[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (_, { asset_type, name }) => {
      const Icon = CollectionIconRecord[asset_type];
      return (
        <div className="flex w-full items-center space-x-2 overflow-hidden">
          {Icon}
          <Text variant="secondary" truncate>
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
    render: (_, { created_by }) => {
      return (
        <Avatar image={created_by?.avatar_url || undefined} name={created_by?.name} size={18} />
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
}> = React.memo(({ setOpenAddTypeModal, selectedCollection, assetList, loadedAsset }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const items: BusterListRowItem<BusterCollectionItemAsset>[] = useMemo(() => {
    return assetList.map((asset) => ({
      id: asset.id,
      link: createAssetLink(asset, selectedCollection.id),
      data: {
        ...asset,
        name: asset.name || `New ${asset.asset_type}`,
        asset_type: asset.asset_type
      }
    }));
  }, [assetList, selectedCollection.id]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  const onOpenAddTypeModal = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
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
            <ListEmptyStateWithButton
              title="You haven’t saved anything to your collection yet."
              buttonText="Add to collection"
              description="As soon as you add metrics and dashboards to your collection, they will appear here."
              onClick={onOpenAddTypeModal}
            />
          ) : null
        }
      />

      <CollectionIndividualSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        collectionId={selectedCollection.id}
      />
    </div>
  );
});
CollectionList.displayName = 'CollectionList';

const CollectionIconRecord: Record<string, React.ReactNode> = {
  dashboard: <ASSET_ICONS.dashboards />,
  metric: <ASSET_ICONS.metrics />
};

const createAssetLink = (asset: BusterCollectionItemAsset, collectionId: string) => {
  if (asset.asset_type === 'metric') {
    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_CHART,
      metricId: asset.id
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
