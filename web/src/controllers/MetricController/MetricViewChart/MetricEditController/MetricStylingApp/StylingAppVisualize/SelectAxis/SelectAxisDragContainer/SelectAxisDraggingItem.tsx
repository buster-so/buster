import {
  DragOverlay,
  type DropAnimation,
  defaultDropAnimation,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type React from 'react';
import { useMemo } from 'react';
import { SelectAxisContainerId } from '../config';
import { SelectAxisItem } from './SelectAxisItem';
import type { DraggedItem } from './interfaces';

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1.05)'
};

export const FROM_AVAILABLE_DURATION = 300;

const dropAnimationAvailable: DropAnimation = {
  ...defaultDropAnimation,
  keyframes: ({ transform }) => [
    { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
    { opacity: 1, transform: CSS.Transform.toString(transform.final) },
    { opacity: 0.35, transform: CSS.Transform.toString(transform.final) },
    { opacity: 0, transform: CSS.Transform.toString(transform.final) }
  ],
  easing: 'ease-in-out',
  duration: FROM_AVAILABLE_DURATION,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '1'
      }
    }
  })
};

export const SelectAxisDragOverlay: React.FC<{
  draggedItem: DraggedItem | null;
  draggedItemOriginalId: string | null;
}> = ({ draggedItem, draggedItemOriginalId }) => {
  const isDraggedFromAvailableZone = draggedItem?.sourceZone === 'available';
  const memoizedDropAnimation = useMemo(() => {
    return isDraggedFromAvailableZone ? dropAnimationAvailable : dropAnimation;
  }, [isDraggedFromAvailableZone]);

  return (
    <DragOverlay dropAnimation={memoizedDropAnimation}>
      {draggedItemOriginalId && draggedItem ? (
        <SelectAxisItem
          id={draggedItemOriginalId}
          isDragging={true}
          isPlaceholder={false}
          zoneId={
            draggedItem?.sourceZone === SelectAxisContainerId.Available
              ? SelectAxisContainerId.Available
              : SelectAxisContainerId.XAxis
          }
        />
      ) : null}
    </DragOverlay>
  );
};
