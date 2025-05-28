import type { DragStartEvent, DragOverEvent, DragEndEvent, Active, Over } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMemoizedFn, useUpdateEffect } from '@/hooks';
import type {
  DropZone,
  SelectAxisItemProps,
  DraggedItem,
  SelectAxisItem,
  DropZoneInternal
} from './interfaces';
import { useMemo, useState, useTransition } from 'react';
import { SelectAxisContainerId } from '../config';
import { v4 as uuidv4 } from 'uuid';
import { useErrorZones } from './useErrorZones';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { FROM_AVAILABLE_DURATION } from './SelectAxisDraggingItem';

export const useDropzonesInternal = ({
  items,
  dropZonesExternal,
  onDropzonesChange
}: {
  items: SelectAxisItem[];
  dropZonesExternal: DropZone[];
  onDropzonesChange: (dropZones: DropZoneInternal[]) => void;
}) => {
  const { openErrorMessage } = useBusterNotifications();

  const availableItems: SelectAxisItemProps[] = useMemo(() => {
    return items.map((itemId) => ({
      id: createUniqueId(),
      originalId: itemId
    }));
    //we need to rekey the available items when the dropzones change
  }, [items, dropZonesExternal]);

  const [dropZones, _setDropZones] = useState<DropZoneInternal[]>(() =>
    initialDropZones(dropZonesExternal)
  );
  const [activeZone, setActiveZone] = useState<SelectAxisContainerId | null>(null);
  const [overZoneId, setOverZoneId] = useState<SelectAxisContainerId | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const { errorZone, setErrorZone, onDragOverCheckErrorZone } = useErrorZones();

  const availableDropZone: DropZoneInternal = {
    id: SelectAxisContainerId.Available,
    title: 'Available',
    items: [] //empty array because we don't need to show items in the available zone
  };

  const setDropZones = useMemo(() => {
    return (
      newDropZones: (prev: DropZoneInternal[]) => DropZoneInternal[],
      saveToExternal = true
    ) => {
      const result = newDropZones(dropZones);
      _setDropZones(result);
      if (saveToExternal) {
        startTransition(() => {
          onDropzonesChange(result);
        });
      }
    };
  }, [dropZones]);

  const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
    const { active } = event;
    const originalId = active?.data?.current?.item?.originalId;
    const isFromAvailable = active?.data?.current?.zoneId === SelectAxisContainerId.Available;
    const sourceZone = isFromAvailable
      ? SelectAxisContainerId.Available
      : findZoneContainingItem(active);

    setActiveZone(sourceZone);
    setDraggedItem({
      id: active.id as string,
      originalId,
      sourceZone,
      targetZone: null
    });
  });

  // Get the zone ID either from the over element or its parent
  const getZoneId = useMemoizedFn((over: Over): SelectAxisContainerId | null => {
    // If hovering directly over a zone
    if (over.data?.current?.type === 'zone') {
      return over.id as SelectAxisContainerId;
    }

    // If hovering over an item, get its parent zone ID from data
    if (over.data?.current?.zoneId) {
      return over.data.current.zoneId;
    }

    // If the item is in the available items list
    if (over.data?.current?.type === 'item') {
      const availableItem = availableItems.find((item) => item.id === over.id);
      if (availableItem) {
        return SelectAxisContainerId.Available;
      }
    }

    // Check if we're directly over the available container
    if (over.id === SelectAxisContainerId.Available) {
      return SelectAxisContainerId.Available;
    }

    return null;
  });

  const handleDragOver = useMemoizedFn((event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) {
      setOverZoneId(null);
      return;
    }

    const targetZoneId = getZoneId(over);
    setOverZoneId(targetZoneId);

    if (draggedItem && targetZoneId) {
      setDraggedItem({
        ...draggedItem,
        targetZone: targetZoneId
      });
    }

    const targetZone = findZoneById(targetZoneId as string);
    const sourceZoneId = findZoneContainingItem(active);
    const sourceZone = findZoneById(sourceZoneId as string);

    onDragOverCheckErrorZone(targetZone, sourceZone, active);
  });

  const cleanupDraggingItem = useMemoizedFn(() => {
    setDraggedItem(null);
    setActiveZone(null);
    setErrorZone(null);
    setOverZoneId(null);
  });

  const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || errorZone?.error) {
      if (errorZone?.reason) {
        openErrorMessage(errorZone.reason);
      }
      cleanupDraggingItem();
      return;
    }

    const overContainer = findZoneByOver(over);

    // Handle dropping on available items container (deletion)
    if (
      (over.id === SelectAxisContainerId.Available ||
        (overContainer && overContainer === SelectAxisContainerId.Available)) &&
      activeZone &&
      activeZone !== SelectAxisContainerId.Available
    ) {
      setDropZones((zones) => {
        const newZones: DropZoneInternal[] = zones.map((zone) => ({
          ...zone,
          items: zone.items.filter((item) => item.id !== active.id)
        }));
        return newZones;
      });
      cleanupDraggingItem();

      return;
    }

    if (!overContainer) {
      cleanupDraggingItem();
      return;
    }

    // Find the containers
    const activeContainer = findZoneContainingItem(active);

    // Handle sorting within the same container
    if (
      activeContainer &&
      activeContainer !== SelectAxisContainerId.Available &&
      activeContainer === overContainer
    ) {
      setDropZones((zones) => {
        const zoneIndex = zones.findIndex((zone) => zone.id === activeContainer);
        if (zoneIndex === -1) return zones;

        const zone = zones[zoneIndex];
        const activeIndex = zone.items.findIndex((item) => item.id === active.id);
        const overIndex = zone.items.findIndex((item) => item.id === over.id);

        if (activeIndex !== overIndex) {
          const newItems = arrayMove(zone.items, activeIndex, overIndex);
          const updatedZone = { ...zone, items: newItems };
          const newZones = [
            ...zones.slice(0, zoneIndex),
            updatedZone,
            ...zones.slice(zoneIndex + 1)
          ];
          return newZones;
        }
        return zones;
      });
    } else {
      // Handle moving between zones or from available items
      const targetZone = findZoneById(overContainer);

      if (targetZone && !isDuplicate(active.id as string, targetZone)) {
        handleMoveBetweenZones(
          activeContainer || SelectAxisContainerId.Available,
          overContainer,
          active.id as string
        );
      }
    }

    // Clean up
    const isFromAvailable = activeZone === SelectAxisContainerId.Available;
    setTimeout(
      () => {
        cleanupDraggingItem();
      },
      isFromAvailable ? FROM_AVAILABLE_DURATION * 0.3 : 0
    );
  });

  // Helper functions for finding zones and checking duplicates
  const findZoneContainingItem = useMemoizedFn((active: Active): SelectAxisContainerId | null => {
    const itemId = active.id as string;
    const zoneId = active.data.current?.zoneId;

    if (zoneId) return zoneId;
    // Check dropzones first
    for (const zone of dropZones) {
      if (zone.items.some((item) => item.id === itemId)) {
        return zone.id;
      }
    }
    // Check available items
    if (availableItems.some((item) => item.id === itemId)) {
      return SelectAxisContainerId.Available;
    }
    return null;
  });

  const findZoneById = useMemoizedFn((zoneId: string): DropZoneInternal => {
    return dropZones.find((zone) => zone.id === zoneId) || availableDropZone;
  });

  const findZoneByOver = useMemoizedFn((over: Over): SelectAxisContainerId | null => {
    const overItemWithZone = over.data?.current?.zoneId;
    if (overItemWithZone) return over.data?.current?.zoneId;
    return findZoneById(over.id as string) ? (over.id as SelectAxisContainerId) : null;
  });

  const isDuplicate = useMemoizedFn((itemId: string, targetZone: DropZoneInternal): boolean => {
    // Check if the item already exists in the target zone
    return targetZone.items.some((item) => item.id === itemId);
  });

  const handleMoveBetweenZones = useMemoizedFn(
    (sourceZoneId: SelectAxisContainerId, targetZoneId: SelectAxisContainerId, itemId: string) => {
      setDropZones((zones) => {
        if (sourceZoneId === SelectAxisContainerId.Available) {
          const itemToAdd = availableItems.find((item) => item.id === itemId);

          if (!itemToAdd) return zones;

          const targetZone = zones.find((zone) => zone.id === targetZoneId);

          if (!targetZone) return zones;

          const newItem: SelectAxisItemProps = itemToAdd;

          const newZones = zones.map((zone) => {
            if (zone.id === targetZoneId) {
              return {
                ...zone,
                items: [...zone.items, newItem]
              };
            }
            return zone;
          });

          return newZones;
        }

        // Handle moving between dropzones
        const sourceZone = zones.find((zone) => zone.id === sourceZoneId);
        const itemToMove = sourceZone?.items.find((item) => item.id === itemId);

        if (!itemToMove) return zones;

        const targetZone = zones.find((zone) => zone.id === targetZoneId);

        if (!targetZone) return zones;

        const hasDuplicate = targetZone.items.some(
          (item) => item.originalId === itemToMove.originalId
        );

        if (hasDuplicate) return zones;

        const newZones = zones.map((zone) => {
          if (zone.id === sourceZoneId) {
            return {
              ...zone,
              items: zone.items.filter((item) => item.id !== itemId)
            };
          }
          if (zone.id === targetZoneId) {
            return {
              ...zone,
              items: [...zone.items, itemToMove]
            };
          }
          return zone;
        });
        onDropzonesChange(newZones);
        return newZones;
      });
    }
  );

  const dropZonesExternalKey = useMemo(() => {
    return createDropZoneKey(dropZonesExternal);
  }, [dropZonesExternal]);

  useUpdateEffect(() => {
    const isInternalAndExternalSame = createDropZoneKey(dropZones) === dropZonesExternalKey;
    if (isInternalAndExternalSame) return;
    setDropZones(() => initialDropZones(dropZonesExternal), false);
  }, [dropZonesExternalKey]);

  return {
    draggedItem,
    dropZones,
    overZoneId,
    errorZone,
    activeZone,
    availableItems,
    handleDragStart,
    handleDragEnd,
    handleDragOver
  };
};

const initialDropZones = (dropZonesExternal: DropZone[]): DropZoneInternal[] => {
  return dropZonesExternal.map((zone) => ({
    ...zone,
    items: zone.items.map((itemId) => ({
      id: createUniqueId(),
      originalId: itemId
    }))
  }));
};

const createDropZoneKey = (dropZone: DropZoneInternal[] | DropZone[]) => {
  return dropZone.reduce((acc, zone) => {
    const itemsKey = zone.items.reduce((acc, item) => {
      const isExternal = typeof item === 'string';
      return acc + (isExternal ? item : item.originalId);
    }, '');
    return acc + zone.id + itemsKey;
  }, '');
};

const createUniqueId = () => {
  return uuidv4();
};
