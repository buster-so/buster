import uniq from 'lodash/uniq';
import React, { useState } from 'react';
import {
  useAddDashboardToCollection,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { CollectionButton } from './CollectionsButton';

export const SaveDashboardToCollectionButton: React.FC<{
  dashboardIds: string[];
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
  selectedCollections: string[];
}> = React.memo(({ dashboardIds, buttonType = 'ghost', useText = false, selectedCollections }) => {
  const { openInfoMessage } = useBusterNotifications();

  const { mutateAsync: addDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: removeDashboardFromCollection } = useRemoveDashboardFromCollection();

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await addDashboardToCollection(
      {
        dashboardIds,
        collectionIds
      },
      {
        onSuccess: () => {
          openInfoMessage('Dashboards saved to collections');
        }
      }
    );
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeDashboardFromCollection(
      {
        dashboardIds,
        collectionIds: [collectionId]
      },
      {
        onSuccess: () => {
          openInfoMessage('Dashboards removed from collections');
        }
      }
    );
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <CollectionButton buttonType={buttonType} useText={useText} />
    </SaveToCollectionsDropdown>
  );
});

SaveDashboardToCollectionButton.displayName = 'SaveDashboardToCollectionButton';
