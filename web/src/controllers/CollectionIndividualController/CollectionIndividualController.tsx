'use client';

import type React from 'react';
import { useState } from 'react';
import { CollectionsIndividualHeader } from './CollectionIndividualHeader';
import { CollectionIndividualContent } from './CollectionIndividualContent';
import { AppPageLayout } from '@/components/ui/layouts';
import { useGetCollection } from '@/api/buster_rest/collections';

export const CollectionIndividualController: React.FC<{
  collectionId: string;
}> = ({ collectionId }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const { data: collection, isFetched: isCollectionFetched } = useGetCollection(collectionId);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <CollectionsIndividualHeader
          openAddTypeModal={openAddTypeModal}
          setOpenAddTypeModal={setOpenAddTypeModal}
          collection={collection}
          isFetched={isCollectionFetched}
        />
      }>
      <CollectionIndividualContent
        collection={collection}
        openAddTypeModal={openAddTypeModal}
        setOpenAddTypeModal={setOpenAddTypeModal}
      />
    </AppPageLayout>
  );
};
