import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React, { useMemo } from 'react';
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
>;

const columns: BusterListColumn<LibraryListItems>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    render: (v: string) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'updated_at',
    title: 'Updated at',
    render: (v: string) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'created_by_name',
    title: 'Created by',
    render: (v, record) => v || record.created_by_email,
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
    const collectionItems = collections.map((collection) => {
      return createLibraryListItem({
        type: 'row',
        id: collection.id,
        data: collection,
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
    const items: BusterListRow<LibraryListItems>[] = collectionRows;

    if (group_by === 'asset_type') {
    } else if (group_by === 'owner') {
    } else if (group_by === 'created_at') {
    } else if (group_by === 'updated_at') {
    } else {
      const _exhaustiveCheck: never | undefined | 'none' = group_by;
      items.push({
        type: 'section',
        id: 'library-assets',
        title: 'Assets',
        secondaryTitle: String(items.length),
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
      scrollContainerRef={scrollContainerRef}
      rows={rows}
      columns={columns}
      infiniteScrollConfig={infiniteScrollConfig}
    />
  );
};
