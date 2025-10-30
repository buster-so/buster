import React, { useMemo } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { CollectionSearchModal } from '@/components/features/search/CollectionSearchModal/CollectionSearchModal';
import { useCollectionSearchStore } from '@/components/features/search/CollectionSearchModal/collection-search-store';
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
  const { toggleCollectionSearch } = useCollectionSearchStore();
  const { data: collection, isFetched: isCollectionFetched } = useGetCollection(collectionId);

  const isEditor = canEdit(collection?.permission);
  const isLoaded = isCollectionFetched && !!collection?.id;

  const onCloseModal = useMemoizedFn(() => {
    toggleCollectionSearch();
  });

  const emptyState = useMemo(() => {
    if (!isLoaded) return null;
    return (
      <ListEmptyStateWithButton
        title="You haven’t saved anything to your collection yet."
        buttonText="Add to collection"
        description="As soon as you add metrics and dashboards to your collection, they will appear here."
        onClick={() => toggleCollectionSearch()}
      />
    );
  }, [toggleCollectionSearch, isLoaded]);

  return (
    <AppPageLayout
      headerSizeVariant="list"
      header={
        <CollectionsIndividualHeader
          setOpenAddTypeModal={toggleCollectionSearch}
          collection={collection}
          isFetched={isCollectionFetched}
          layout={layout}
        />
      }
    >
      {isLoaded && (
        <React.Fragment>
          {/* {layout === 'list' && ( */}
          <CollectionIndividualListContent collection={collection} emptyState={emptyState} />
          {/* )}
          {layout === 'grid' && (
            <div className="text-center text-sm text-gray-500 flex items-center justify-center h-full">
              Grid view is coming soon
            </div>
          )} */}
        </React.Fragment>
      )}

      {isEditor && <CollectionSearchModal collectionId={collection.id} />}
    </AppPageLayout>
  );
};
