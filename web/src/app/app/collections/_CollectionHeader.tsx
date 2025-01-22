'use client';

import React, { useContext, useMemo } from 'react';
import { AppContentHeader } from '../_components/AppContentHeader';
import { Breadcrumb, Button } from 'antd';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import {
  initialFilterOptionKey,
  useBusterCollections,
  useCollectionsContextSelector,
  useIndividualCollection
} from '@/context/Collections';
import { AppMaterialIcons, AppSegmented, AppTooltip } from '@/components';
import { useHotkeys } from 'react-hotkeys-hook';
import { SegmentedLabeledOption, SegmentedValue } from 'antd/es/segmented';
import { CollectionsListEmit } from '@/api/buster_socket/collections';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

export const CollectionHeader: React.FC<{}> = React.memo(() => {
  const onSetCollectionListFilters = useCollectionsContextSelector(
    (x) => x.onSetCollectionListFilters
  );
  const collectionListFilters = useCollectionsContextSelector((x) => x.collectionListFilters);
  const openedCollectionId = useCollectionsContextSelector((x) => x.openedCollectionId);
  const setOpenNewCollectionModal = useCollectionsContextSelector(
    (x) => x.setOpenNewCollectionModal
  );
  const collectionStatus = useCollectionsContextSelector(
    (x) => x.collectionStatus[initialFilterOptionKey]
  );
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const { collection } = useIndividualCollection({
    collectionId: openedCollectionId,
    ignoreSubscribe: true
  });

  const collectionTitle = collection?.name || 'Collections';

  const showFilters = useMemo(
    () =>
      (collectionStatus?.fetched && collectionsList.length !== 0) ||
      !isEmpty(collectionsList) ||
      !isEmpty(omit(collectionListFilters, 'page', 'page_size')),
    [collectionStatus?.fetched, collectionsList, collectionListFilters]
  );

  const breadcrumbItems = useMemo(
    () =>
      [
        {
          title: (
            <Link
              suppressHydrationWarning
              href={
                openedCollectionId
                  ? createBusterRoute({
                      route: BusterRoutes.APP_COLLECTIONS_ID,
                      collectionId: openedCollectionId
                    })
                  : createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS })
              }>
              {collectionTitle}
            </Link>
          )
        }
      ].filter((item) => item.title),
    [openedCollectionId, collectionTitle]
  );

  useHotkeys('c', () => {
    setOpenNewCollectionModal(true);
  });

  return (
    <>
      <AppContentHeader className="items-center justify-between space-x-2">
        <div className="flex space-x-1">
          <Breadcrumb className="flex items-center" items={breadcrumbItems} />
          {showFilters && (
            <CollectionFilters
              collectionListFilters={collectionListFilters}
              onChangeFilter={onSetCollectionListFilters}
            />
          )}
        </div>

        <div className="flex items-center">
          <AppTooltip title={'Create new collection'} shortcuts={['C']}>
            <Button
              type="default"
              icon={<AppMaterialIcons icon="add" />}
              onClick={() => setOpenNewCollectionModal(true)}>
              New Collection
            </Button>
          </AppTooltip>
        </div>
      </AppContentHeader>
    </>
  );
});
CollectionHeader.displayName = 'CollectionHeader';

const filters = [
  {
    label: 'All',
    value: JSON.stringify({})
  },
  {
    label: 'My collections',
    value: JSON.stringify({ owned_by_me: true })
  },
  {
    label: 'Shared with me',
    value: JSON.stringify({ shared_with_me: true })
  }
];

const CollectionFilters: React.FC<{
  onChangeFilter: ReturnType<typeof useBusterCollections>['onSetCollectionListFilters'];
  collectionListFilters?: Omit<CollectionsListEmit['payload'], 'page' | 'page_size'>;
}> = React.memo(({ onChangeFilter, collectionListFilters }) => {
  const value = useMemo(() => {
    const activeFiltersValue = JSON.stringify(collectionListFilters);
    return filters.find((f) => f.value === activeFiltersValue)?.value || filters[0].value;
  }, [filters, collectionListFilters]);

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented
        options={filters}
        value={value}
        onChange={(v) => {
          onChangeFilter(JSON.parse(v as string));
        }}
      />
    </div>
  );
});
CollectionFilters.displayName = 'CollectionFilters';
