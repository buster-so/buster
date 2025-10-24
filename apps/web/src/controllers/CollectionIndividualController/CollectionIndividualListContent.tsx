import type { AssetType } from '@buster/server-shared/assets';
import type {
  BusterCollection,
  BusterCollectionItemAsset,
} from '@buster/server-shared/collections';
import React, { useMemo, useState } from 'react';
import { ASSET_ICONS, assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { Avatar } from '@/components/ui/avatar';
import {
  BusterList,
  type BusterListColumn,
  type BusterListRow,
  createListItem,
} from '@/components/ui/list/BusterListNew';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { CollectionIndividualSelectedPopup } from './CollectionsIndividualPopup';

const columns: BusterListColumn<BusterCollectionItemAsset>[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (_, { asset_type, name }) => {
      const Icon = assetTypeToIcon(asset_type);
      return (
        <div className="flex w-full items-center space-x-2 overflow-hidden">
          <Icon />
          <Text variant="secondary" truncate>
            {name}
          </Text>
        </div>
      );
    },
  },
  {
    dataIndex: 'updated_at',
    title: 'Updated at',
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

export const CollectionIndividualListContent: React.FC<{
  collection: BusterCollection;
  emptyState: React.ReactNode;
}> = React.memo(({ collection, emptyState }) => {
  const assetList = collection?.assets || [];

  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());

  const rows: BusterListRow<BusterCollectionItemAsset>[] = useMemo(() => {
    if (assetList.length === 0) return [];

    const createAssetLinkItem = createListItem<BusterCollectionItemAsset>();
    const allRows: BusterListRow<BusterCollectionItemAsset>[] = [
      {
        type: 'section',
        id: 'collection-assets',
        title: 'Assets',
        secondaryTitle: String(assetList.length),
      },
    ];

    assetList.forEach((asset) => {
      allRows.push(
        createAssetLinkItem({
          id: asset.id,
          link: createSimpleAssetRoute(asset),
          data: {
            ...asset,
            name: asset.name || `New ${asset.asset_type}`,
          },
          type: 'row',
        })
      );
    });
    return allRows;
  }, [assetList, collection.id]);

  const onSelectChange = useMemoizedFn((v: Set<string>) => {
    // setSelectedRowKeys(selectedRowKeys);
    setSelectedRowKeys(v);
  });

  return (
    <React.Fragment>
      <BusterList
        rows={rows}
        columns={columns}
        hideLastRowBorder={false}
        showSelectAll={true}
        showHeader={true}
        emptyState={emptyState}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
      />

      <CollectionIndividualSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        collectionId={collection.id}
      />
    </React.Fragment>
  );
});

CollectionIndividualListContent.displayName = 'CollectionIndividualListContent';
