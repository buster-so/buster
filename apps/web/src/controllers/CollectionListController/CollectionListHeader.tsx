import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import React, { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useGetCollection } from '@/api/buster_rest/collections';
import type { collectionsGetList } from '@/api/buster_rest/collections/requests';
import { Breadcrumb, type BreadcrumbItemType } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

type CollectionListFilters = Omit<Parameters<typeof collectionsGetList>[0], 'page' | 'page_size'>;
type SetCollectionListFilters = (filters: CollectionListFilters) => void;

export const CollectionListHeader: React.FC<{
  collectionId?: string;
  setOpenNewCollectionModal: (open: boolean) => void;
  isCollectionListFetched: boolean;
  collectionsList: BusterCollectionListItem[];
  collectionListFilters: CollectionListFilters;
  setCollectionListFilters: SetCollectionListFilters;
}> = React.memo(
  ({
    collectionId,
    setOpenNewCollectionModal,
    collectionListFilters,
    setCollectionListFilters,
  }) => {
    const { data: collection } = useGetCollection(collectionId);
    const collectionTitle = collection?.name || 'Collections';
    const showFilters = true;

    const breadcrumbItems: BreadcrumbItemType[] = useMemo(
      () => [
        {
          label: collectionTitle,
          route: collectionId
            ? {
                to: '/app/collections/$collectionId',
                params: {
                  collectionId: collectionId,
                },
              }
            : { to: '/app/collections' },
        },
      ],
      [collectionId, collectionTitle]
    );

    useHotkeys(
      'n',
      () => {
        setOpenNewCollectionModal(true);
      },
      { preventDefault: true }
    );

    return (
      <>
        <div className="flex space-x-3">
          <Breadcrumb items={breadcrumbItems} />
          {showFilters && (
            <CollectionFilters
              collectionListFilters={collectionListFilters}
              setCollectionListFilters={setCollectionListFilters}
            />
          )}
        </div>

        <div className="flex items-center">
          <AppTooltip title={'Create new collection'} shortcuts={['N']}>
            <Button prefix={<Plus />} onClick={() => setOpenNewCollectionModal(true)}>
              New Collection
            </Button>
          </AppTooltip>
        </div>
      </>
    );
  }
);
CollectionListHeader.displayName = 'CollectionListHeader';

const filters: SegmentedItem<string>[] = [
  {
    label: 'All',
    value: JSON.stringify({}),
  },
];

const CollectionFilters: React.FC<{
  setCollectionListFilters: SetCollectionListFilters;
  collectionListFilters?: CollectionListFilters;
}> = React.memo(({ setCollectionListFilters, collectionListFilters }) => {
  const value = useMemo(() => {
    const activeFiltersValue = JSON.stringify(collectionListFilters);
    return filters.find((f) => f.value === activeFiltersValue)?.value || filters[0].value;
  }, [filters, collectionListFilters]);

  const onChangeFilter = useMemoizedFn((v: SegmentedItem) => {
    let parsedValue: CollectionListFilters = {};
    try {
      parsedValue = JSON.parse(v.value as string);
    } catch (error) {
      console.error('error', error);
    }
    setCollectionListFilters(parsedValue);
  });

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented options={filters} value={value} type="button" onChange={onChangeFilter} />
    </div>
  );
});
CollectionFilters.displayName = 'CollectionFilters';
