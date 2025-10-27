import { useMemo } from 'react';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { Avatar } from '@/components/ui/avatar';
import type {
  BusterListColumn,
  BusterListRow,
  InfiniteScrollConfig,
} from '@/components/ui/list/BusterListNew';
import {
  BusterList,
  type BusterListSectionRow,
  createListItem,
} from '@/components/ui/list/BusterListNew';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import type { AssetListItem, AssetListViewListProps } from '../AssetList.types';
import { getGroupMetadata } from '../grouping-meta-helpers';

const columns: BusterListColumn<AssetListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    render: (v, record) => {
      const Icon = assetTypeToIcon(record.asset_type || 'collection');
      return (
        <span className="flex gap-1.5 items-center">
          <span className="text-icon-color">
            <Icon />
          </span>
          <span>{v}</span>
        </span>
      );
    },
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 145,
    render: (v: string) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'updated_at',
    title: 'Updated at',
    width: 145,
    render: (v: string) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'created_by_avatar_url',
    title: 'Owner',
    width: 50,
    render: (v, record) => {
      return <Avatar image={v} name={record.created_by_name} size={18} />;
    },
  },
];

const createAssetListItem = createListItem<AssetListItem>();

export const AssetListViewList = ({
  items,
  groupBy,
  groups,
  prelistItems,
  isFetchingNextPage,
  scrollContainerRef,
  emptyContent,
}: AssetListViewListProps) => {
  const rows: BusterListRow<AssetListItem>[] = useMemo(() => {
    const allRows: BusterListRow<AssetListItem>[] = [...prelistItems];

    if (
      groupBy === 'asset_type' ||
      groupBy === 'owner' ||
      groupBy === 'created_at' ||
      groupBy === 'updated_at'
    ) {
      if (!groups) return allRows;
      Object.entries(groups).forEach(([groupKey, groupItems]) => {
        const { title, icon } = getGroupMetadata(groupKey, groupItems, groupBy);
        allRows.push({
          type: 'section',
          id: groupKey,
          title: (
            <span className="flex gap-1.5 items-center">
              <span className="text-icon-color">{icon}</span>
              <span>{title}</span>
            </span>
          ),
          secondaryTitle: String(groupItems.length),
        } satisfies BusterListSectionRow);
        allRows.push(
          ...groupItems.map((item) =>
            createAssetListItem({
              type: 'row',
              id: item.asset_id,
              data: item,
              link: createSimpleAssetRoute({
                asset_type: item.asset_type,
                id: item.asset_id,
              }),
            })
          )
        );
      });
    } else {
      const _exhaustiveCheck: never | undefined | 'none' = groupBy;
      allRows.push({
        type: 'section',
        id: 'asset-list',
        title: 'Assets',
        secondaryTitle: String(items.length),
      } satisfies BusterListSectionRow);
      allRows.push(
        ...items.map((result) => {
          return createAssetListItem({
            type: 'row',
            id: result.asset_id,
            data: result,
            link: createSimpleAssetRoute({
              asset_type: result.asset_type,
              id: result.asset_id,
            }),
          });
        })
      );
    }

    return allRows;
  }, [items, groups, prelistItems, groupBy]);

  const infiniteScrollConfig: InfiniteScrollConfig | undefined = useMemo(
    () =>
      isFetchingNextPage
        ? {
            loadingNewContent: <div>Loading...</div>,
          }
        : undefined,
    [isFetchingNextPage]
  );

  return (
    <BusterList
      scrollParentRef={scrollContainerRef}
      rows={rows}
      columns={columns}
      infiniteScrollConfig={infiniteScrollConfig}
      hideLastRowBorder={false}
      showSelectAll={true}
      showHeader={true}
      emptyState={emptyContent}
    />
  );
};
