import type React from 'react';
import {
  useGetMetric,
  useRemoveMetricFromCollection,
  useSaveMetricToCollections,
} from '@/api/buster_rest/metrics';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { CollectionButton } from './CollectionsButton';

export const SaveMetricToCollectionButton: React.FC<{
  metricId: string;
  cacheId?: string;
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
}> = ({ metricId, buttonType = 'ghost', cacheId, useText = false }) => {
  const { openInfoMessage } = useBusterNotifications();
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: selectedCollections } = useGetMetric(
    { id: metricId, cacheId },
    { select: (x) => x.collections?.map((x) => x.id) }
  );

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveMetricToCollection({
      metricIds: [metricId],
      collectionIds,
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeMetricFromCollection({
      metricIds: [metricId],
      collectionIds: [collectionId],
    });
    openInfoMessage('Metrics removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections || []}
    >
      <CollectionButton buttonType={buttonType} useText={useText} />
    </SaveToCollectionsDropdown>
  );
};
