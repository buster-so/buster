import uniq from 'lodash/uniq';
import type React from 'react';
import { useState } from 'react';
import {
  useRemoveMetricFromCollection,
  useSaveMetricToCollections
} from '@/api/buster_rest/metrics';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { CollectionButton } from './CollectionsButton';

export const SaveMetricToCollectionButton: React.FC<{
  metricIds: string[];
  selectedCollections: string[];
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
}> = ({
  metricIds,
  selectedCollections: selectedCollectionsProp,
  buttonType = 'ghost',
  useText = false
}) => {
  const { openInfoMessage } = useBusterNotifications();
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();

  const [selectedCollections, setSelectedCollections] =
    useState<Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']>(
      selectedCollectionsProp
    );

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections((prev) => uniq([...prev, ...collectionIds]));
    await saveMetricToCollection({
      metricIds,
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((x) => x !== collectionId));
    await removeMetricFromCollection({
      metricIds,
      collectionIds: [collectionId]
    });
    openInfoMessage('Metrics removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <CollectionButton buttonType={buttonType} useText={useText} />
    </SaveToCollectionsDropdown>
  );
};
