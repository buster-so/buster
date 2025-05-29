'use client';

import type React from 'react';
import { useState } from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import type { collectionsGetList } from '@/api/buster_rest/collections/requests';
import { AppPageLayout } from '@/components/ui/layouts';
import { CollectionListHeader } from './CollectionListHeader';
import { CollectionsListContent } from './CollectionsListContent';

export const CollectionListController: React.FC = () => {
  const [openNewCollectionModal, setOpenNewCollectionModal] = useState(false);
  const [collectionListFilters, setCollectionListFilters] = useState<
    Omit<Parameters<typeof collectionsGetList>[0], 'page_token' | 'page_size'>
  >({});

  const { data: collectionsList, isFetched: isCollectionListFetched } =
    useGetCollectionsList(collectionListFilters);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      scrollable={false}
      header={
        <CollectionListHeader
          setOpenNewCollectionModal={setOpenNewCollectionModal}
          isCollectionListFetched={isCollectionListFetched}
          collectionsList={collectionsList}
          collectionListFilters={collectionListFilters}
          setCollectionListFilters={setCollectionListFilters}
        />
      }>
      <CollectionsListContent
        openNewCollectionModal={openNewCollectionModal}
        isCollectionListFetched={isCollectionListFetched}
        collectionsList={collectionsList}
        setOpenNewCollectionModal={setOpenNewCollectionModal}
      />
    </AppPageLayout>
  );
};
