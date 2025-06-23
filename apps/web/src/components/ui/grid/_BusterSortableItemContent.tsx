import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const BusterSortableItemContent = React.memo(
  forwardRef<
    HTMLDivElement,
    {
      style?: React.CSSProperties;
      itemId: string;
      isDragOverlay?: boolean;
      isDragging?: boolean;
      children?: React.ReactNode;
    }
  >(({ style, children, itemId, isDragging, isDragOverlay }, setNodeRef) => {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative h-full w-full overflow-hidden rounded-sm',
          'transition-shadow duration-200 ease-in-out',
          isDragOverlay && 'shadow-lg',
          isDragging && 'dragging z-10 transition-none',
          isDragging ? (isDragOverlay ? 'opacity-90' : 'opacity-40') : 'opacity-100',
          'translate-x-[var(--translate-x,0)] translate-y-[var(--translate-y,0)] scale-[var(--scale,1)]'
        )}>
        {children}
      </div>
    );
  })
);
BusterSortableItemContent.displayName = 'BusterSortableItemContent';
