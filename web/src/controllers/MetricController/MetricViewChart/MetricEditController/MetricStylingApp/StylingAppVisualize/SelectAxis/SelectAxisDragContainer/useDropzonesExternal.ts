import { useMemoizedFn } from '@/hooks';
import {} from 'react';
import type { DropZone, DropZoneInternal } from './interfaces';

export const useDropzonesExternal = ({
  onChange
}: {
  onChange?: (dropZones: DropZone[]) => void;
}) => {
  const onDropzonesChange = useMemoizedFn((dropZones: DropZoneInternal[]) => {
    if (onChange) {
      onChange(
        dropZones.map((zone) => ({
          ...zone,
          items: zone.items.map(({ originalId }) => originalId)
        }))
      );
    }
  });

  return { onDropzonesChange };
};
