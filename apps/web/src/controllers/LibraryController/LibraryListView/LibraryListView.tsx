import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React, { useMemo } from 'react';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { Avatar } from '@/components/ui/avatar';
import { ListEmptyStateWithButton } from '@/components/ui/list';
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
import { getGroupMetadata } from '../grouping-meta-helpers';
import type { LibraryViewProps } from '../library.types';

type LibraryListItems = Pick<
  LibraryAssetListItem | BusterCollectionListItem,
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'created_by'
  | 'created_by_name'
  | 'created_by_email'
  | 'created_by_avatar_url'
> & {
  asset_type: AssetType;
};

const columns: BusterListColumn<LibraryListItems>[] = [
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

const createLibraryListItem = createListItem<LibraryListItems>();

export const LibraryListView = ({
  allResults,
  collections,
  filters,
  isFetchingNextPage,
  scrollContainerRef,
  allGroups,
}: LibraryViewProps) => {
  const { group_by } = filters;

  const collectionRows: BusterListRow<LibraryListItems>[] = useMemo(() => {
    if (collections.length === 0) return [];
    const collectionItems = collections.map((collection) => {
      return createLibraryListItem({
        type: 'row',
        id: collection.id,
        data: { ...collection, asset_type: 'collection' as const },
        link: {
          to: '/app/collections/$collectionId',
          params: {
            collectionId: collection.id,
          },
        },
      });
    });

    return [
      {
        type: 'section',
        id: 'collections',
        title: 'Collections',
        secondaryTitle: String(collectionItems.length),
      } satisfies BusterListSectionRow,
      ...collectionItems,
    ];
  }, [collections]);

  const rows: BusterListRow<LibraryListItems>[] = useMemo(() => {
    const items: BusterListRow<LibraryListItems>[] = [...collectionRows];

    if (allResults.length === 0) return items;

    if (
      group_by === 'asset_type' ||
      group_by === 'owner' ||
      group_by === 'created_at' ||
      group_by === 'updated_at'
    ) {
      if (!allGroups) return items;
      Object.entries(allGroups).forEach(([groupKey, groupItems]) => {
        const { title, icon } = getGroupMetadata(groupKey, groupItems, group_by);
        items.push({
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
        items.push(
          ...groupItems.map((item) =>
            createLibraryListItem({
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
      const _exhaustiveCheck: never | undefined | 'none' = group_by;
      items.push({
        type: 'section',
        id: 'library-assets',
        title: 'Assets',
        secondaryTitle: String(allResults.length),
      } satisfies BusterListSectionRow);
      items.push(
        ...allResults.map((result) => {
          return createLibraryListItem({
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

    return items;
  }, [allResults, allGroups, collectionRows, group_by]);

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
      emptyState={useMemo(
        () => (
          <ListEmptyStateWithButton
            title="No library items found"
            description="You don’t have any library items. As soon as you do add some, they will start to  appear here."
            buttonText="Add item"
            onClick={() => {
              alert('new chat');
            }}
          />
        ),
        []
      )}
    />
  );
};
