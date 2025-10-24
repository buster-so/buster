import React, { useMemo, useState } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { AddToCollectionModal } from '@/components/features/collections/AddToCollectionModal';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { canEdit } from '@/lib/share';
import { CollectionsIndividualHeader } from './CollectionIndividualHeader';
import { CollectionIndividualListContent } from './CollectionIndividualListContent';

export const CollectionIndividualController: React.FC<{
  collectionId: string;
  layout: 'grid' | 'list';
}> = ({ collectionId, layout }) => {
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const { data: collection, isFetched: isCollectionFetched } = useGetCollection(collectionId);

  const isEditor = canEdit(collection?.permission);
  const isLoaded = isCollectionFetched && !!collection?.id;

  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  const emptyState = useMemo(() => {
    if (!isLoaded) return null;
    return (
      <ListEmptyStateWithButton
        title="You haven’t saved anything to your collection yet."
        buttonText="Add to collection"
        description="As soon as you add metrics and dashboards to your collection, they will appear here."
        onClick={() => setOpenAddTypeModal(true)}
      />
    );
  }, [setOpenAddTypeModal, isLoaded]);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <CollectionsIndividualHeader
          setOpenAddTypeModal={setOpenAddTypeModal}
          collection={collection}
          isFetched={isCollectionFetched}
          layout={layout}
        />
      }
    >
      {isLoaded && (
        <React.Fragment>
          {layout === 'list' && (
            <CollectionIndividualListContent collection={collection} emptyState={emptyState} />
          )}
          {layout === 'grid' && (
            <div className="text-center text-sm text-gray-500 flex items-center justify-center h-full">
              Grid view is coming soon
            </div>
          )}
        </React.Fragment>
      )}

      {isEditor && (
        <AddToCollectionModal
          open={openAddTypeModal}
          onClose={onCloseModal}
          collectionId={collection.id}
        />
      )}
    </AppPageLayout>
  );
};
