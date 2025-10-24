import type {
  BusterCollection,
  BusterCollectionItemAsset,
} from '@buster/server-shared/collections';
import React, { useMemo, useState } from 'react';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
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
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { CollectionIndividualSelectedPopup } from './CollectionsIndividualPopup';

export const CollectionIndividualListContent: React.FC<{
  collection: BusterCollection;
  emptyState: React.ReactNode;
}> = React.memo(({ collection, emptyState }) => {
  const assetList = collection?.assets || [];

  return (
    <CollectionList assetList={assetList} selectedCollection={collection} emptyState={emptyState} />
  );
});

CollectionIndividualListContent.displayName = 'CollectionIndividualListContent';

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
    },
  },
  {
    dataIndex: 'updated_at',
    title: 'Last edited',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 145,
    render: (v) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'created_by',
    title: 'Owner',
    width: 50,
    render: (_, { created_by }) => {
      return (
        <Avatar image={created_by?.avatar_url || undefined} name={created_by?.name} size={18} />
      );
    },
  },
];

const CollectionList: React.FC<{
  assetList: BusterCollectionItemAsset[];
  selectedCollection: BusterCollection;
  emptyState: React.ReactNode;
}> = React.memo(({ selectedCollection, assetList, emptyState }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const items: BusterListRowItem<BusterCollectionItemAsset>[] = useMemo(() => {
    const createAssetLinkItem = createListItem<BusterCollectionItemAsset>();
    return assetList.map((asset) =>
      createAssetLinkItem({
        id: asset.id,
        link: createSimpleAssetRoute(asset),
        data: {
          ...asset,
          name: asset.name || `New ${asset.asset_type}`,
          asset_type: asset.asset_type,
        },
      })
    );
  }, [assetList, selectedCollection.id]);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });

  return (
    <div className="relative flex h-full flex-col items-center">
      <BusterList
        rows={items}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={emptyState}
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
  metric: <ASSET_ICONS.metrics />,
  report: <ASSET_ICONS.reports />,
};
