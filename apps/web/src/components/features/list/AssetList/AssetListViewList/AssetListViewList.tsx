import type { GroupedAssets } from '@buster/server-shared/library';
import { useMemo, useState } from 'react';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import { Avatar } from '@/components/ui/avatar';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
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
import { Popover } from '@/components/ui/popover';
import { AppTooltip } from '@/components/ui/tooltip';
import { assetTypeLabel } from '@/lib/assets/asset-translations';
import { cn } from '@/lib/classMerge';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import type { AssetListItem, AssetListViewListProps } from '../AssetList.types';
import { getGroupMetadata } from '../grouping-meta-helpers';

const NameComponent = (name: string, record: AssetListItem) => {
  const Icon = assetTypeToIcon(record.asset_type || 'collection');
  const imageUrl = record.screenshot_url ?? getScreenshotSkeleton(record.asset_type);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <span className="flex gap-1.5 items-center w-full">
      <AppTooltip title={assetTypeLabel(record.asset_type)}>
        <span className="text-icon-color flex-shrink-0">
          <Icon />
        </span>
      </AppTooltip>
      <Popover
        trigger="hover"
        align="start"
        childrenClassName="truncate block min-w-0"
        delayDuration={record.screenshot_url ? 240 : 650}
        className={cn('max-h-36 w-42 p-0.5', isLoaded ? '' : 'hidden')}
        content={
          <img
            src={imageUrl}
            alt={record.name}
            className={cn('max-h-36 w-auto max-w-full object-top object-contain mx-auto block')}
            onLoad={() => setIsLoaded(true)}
          />
        }
      >
        <div className="truncate">{name}</div>
      </Popover>
    </span>
  );
};

const columns: BusterListColumn<AssetListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
    render: NameComponent,
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

const RowTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => {
  return (
    <span className="flex gap-1.5 items-center">
      <span className="text-icon-color">{icon}</span>
      <span>{title}</span>
    </span>
  );
};

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
    const allRows: BusterListRow<AssetListItem>[] = [...(prelistItems ?? [])];

    if (
      groupBy === 'asset_type' ||
      groupBy === 'owner' ||
      groupBy === 'created_at' ||
      groupBy === 'updated_at' ||
      groups
    ) {
      if (!groups) return allRows;
      Object.entries(groups).forEach(([groupKey, groupItems]) => {
        const { title, icon } = getGroupMetadata(
          groupKey as keyof GroupedAssets,
          groupItems,
          groupBy
        );
        allRows.push({
          type: 'section',
          id: groupKey,
          title: <RowTitle icon={icon} title={title} />,
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
        title: <RowTitle icon={<Grid2 />} title="Assets" />,
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
    () => (isFetchingNextPage ? { loadingNewContent: <span>Loading...</span> } : undefined),
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
