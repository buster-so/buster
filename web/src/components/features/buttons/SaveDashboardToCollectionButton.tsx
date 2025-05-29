import {
  useAddDashboardToCollection,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import uniq from 'lodash/uniq';
import React, { useState } from 'react';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { CollectionButton } from './CollectionsButton';

export const SaveDashboardToCollectionButton: React.FC<{
  dashboardIds: string[];
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
  selectedCollections: string[];
}> = React.memo(
  ({
    dashboardIds,
    buttonType = 'ghost',
    useText = false,
    selectedCollections: selectedCollectionsProp
  }) => {
    const { openInfoMessage } = useBusterNotifications();

    const [selectedCollections, setSelectedCollections] =
      useState<Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']>(
        selectedCollectionsProp
      );
    const { mutateAsync: addDashboardToCollection } = useAddDashboardToCollection();
    const { mutateAsync: removeDashboardFromCollection } = useRemoveDashboardFromCollection();

    const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
      setSelectedCollections((prev) => uniq([...prev, ...collectionIds]));
      await addDashboardToCollection({
        dashboardIds,
        collectionIds
      });

      openInfoMessage('Dashboards saved to collections');
    });

    const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
      setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
      await removeDashboardFromCollection({
        dashboardIds,
        collectionIds: [collectionId]
      });
      openInfoMessage('Dashboards removed from collections');
    });

    return (
      <SaveToCollectionsDropdown
        onSaveToCollection={onSaveToCollection}
        onRemoveFromCollection={onRemoveFromCollection}
        selectedCollections={selectedCollections}>
        <CollectionButton buttonType={buttonType} useText={useText} />
      </SaveToCollectionsDropdown>
    );
  }
);

SaveDashboardToCollectionButton.displayName = 'SaveDashboardToCollectionButton';
