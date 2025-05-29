import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { createContext, useMemo } from 'react';
import { BusterSortableItemContent } from './_BusterSortableItemContent';

interface Context {
  attributes: Record<string, any>;
  listeners: DraggableSyntheticListeners;
  // ref(node: HTMLElement | null): void;
  isDragging: boolean;
}

export const SortableItemContext = createContext<Context>({
  attributes: {},
  listeners: undefined,
  isDragging: false
});

export const BusterSortableItemDragContainer: React.FC<{
  itemId: string;
  allowEdit?: boolean;
  children: React.ReactNode;
}> = React.memo(({ itemId, allowEdit = true, children }) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isSorting
  } = useSortable({
    id: itemId,
    disabled: !allowEdit,
    animateLayoutChanges: () => {
      return true;
    }
  });

  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
      isDragging
    }),
    [attributes, listeners, isDragging, setActivatorNodeRef]
  );

  const memoizedStyle = useMemo(() => {
    return {
      transform: isSorting ? undefined : CSS.Translate.toString(transform),
      transition
    };
  }, [isSorting, transform, transition]);

  return (
    <SortableItemContext.Provider value={context}>
      <BusterSortableItemContent
        ref={setNodeRef}
        itemId={itemId}
        isDragging={isDragging}
        isDragOverlay={false}
        style={memoizedStyle}>
        {children}
      </BusterSortableItemContent>
    </SortableItemContext.Provider>
  );
});

BusterSortableItemDragContainer.displayName = 'BusterSortableItemDragContainer';
