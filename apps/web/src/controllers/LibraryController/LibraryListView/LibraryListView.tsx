import type { LibraryAssetListItem } from '@buster/server-shared/library';
import React, { useMemo } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import { BusterList } from '@/components/ui/list';
import type { BusterListColumn, BusterListRow } from '@/components/ui/list/BusterListNew';
import { type BusterListSectionRow, createListItem } from '@/components/ui/list/BusterListNew';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import type { LibraryViewProps } from '../library.types';

const columns: BusterListColumn<LibraryAssetListItem | BusterCollectionListItem>[] = [
  {
    dataIndex: 'name',
    title: 'Name',
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'updated_at',
    title: 'Updated at',
    render: (v) => formatDate({ date: v, format: 'lll' }),
  },
  {
    dataIndex: 'created_by',
    title: 'Created by',
    render: (v) => v,
  },
];

const createLibraryAssetListItem = createListItem<LibraryAssetListItem>();
const createCollectionListItem = createListItem<BusterCollectionListItem>();

export const LibraryListView = ({
  allResults,
  collections,
  filters,
  isFetchingNextPage,
  scrollContainerRef,
  allGroups,
}: LibraryViewProps) => {
  const { group_by } = filters;
  console.log({ collections, allResults });

  const collectionRows: BusterListRow<BusterCollectionListItem>[] = useMemo(() => {
    const collectionItems = collections.map((collection) => {
      return createCollectionListItem({
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

  const rows: BusterListRow<LibraryAssetListItem | BusterCollectionListItem>[] = useMemo(() => {
    const items: BusterListRow<LibraryAssetListItem | BusterCollectionListItem>[] = collectionRows;

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
          return createLibraryAssetListItem({
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

  return <BusterList rows={rows} columns={columns} />;
};
