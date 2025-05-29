import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useMemo } from 'react';
import { cn } from '@/lib/classMerge';
import { StylingLabel } from '../../../Common';
import { SelectAxisSettingsButton } from '../SelectAxisSettingsContent';
import type { DraggedItem, DropZoneInternal } from './interfaces';
import { SelectAxisSortableItem } from './SelectAxisSortableItem';

export const SelectAxisDropZone: React.FC<{
  zone: DropZoneInternal;
  isError: boolean;
  isOverZone: boolean;
  activeZone: string | null;
  draggedItem: DraggedItem | null;
}> = React.memo(({ zone, isError, isOverZone, activeZone, draggedItem }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
    data: {
      type: 'zone'
    }
  });

  const showHoverState = (isOver || isOverZone) && !isError;
  const isSameZoneDrag = (isOver || isOverZone) && activeZone === zone.id;

  const extraClass = useMemo(() => {
    if (isError) return 'text-danger-foreground shadow-[0_0_3px_1px] bg-red-200 shadow-red-200';
    if (isSameZoneDrag) return 'text-foreground shadow-[0_0_3px_1px] shadow-primary bg-primary/20';
    if (showHoverState) return 'text-[#32a852] shadow-[0_0_3px_1px_#32a852] bg-[#e6fce6]';
    return '';
  }, [isError, isSameZoneDrag, showHoverState]);

  const hasItems = zone.items.length > 0;

  return (
    <div ref={setNodeRef} data-testid={`select-axis-drop-zone-${zone.id}`}>
      <StylingLabel
        className="space-y-2!"
        label={zone.title}
        labelExtra={<SelectAxisSettingsButton zoneId={zone.id} />}>
        {hasItems && (
          <SortableContext
            items={zone.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}>
            <div className={cn('space-y-0.5 rounded transition', extraClass)}>
              {zone.items.map((item) => (
                <SelectAxisSortableItem
                  key={item.originalId}
                  item={item}
                  zoneId={zone.id}
                  isPlaceholder={item.id === draggedItem?.id && draggedItem?.sourceZone !== zone.id}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {!hasItems && <EmptyDropZone className={extraClass} />}
      </StylingLabel>
    </div>
  );
});
SelectAxisDropZone.displayName = 'SelectAxisDropZone';

const EmptyDropZone: React.FC<{
  className: string;
}> = React.memo(({ className }) => {
  return (
    <div
      className={cn(
        'flex h-[32px] w-full items-center justify-center',
        'rounded transition-all duration-100 ease-in-out',
        className ? className : 'border-border border border-dashed bg-transparent'
      )}>
      <span className="text-sm select-none">Drag column here</span>
    </div>
  );
});
EmptyDropZone.displayName = 'EmptyDropZone';
