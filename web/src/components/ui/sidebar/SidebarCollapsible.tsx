'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../collapsible/CollapsibleBase';
import { CaretDown } from '../icons/NucleoIconFilled';
import type { ISidebarGroup } from './interfaces';
import { SidebarItem } from './SidebarItem';
import { COLLAPSED_HIDDEN } from './config';

const modifiers = [restrictToVerticalAxis];

interface SidebarTriggerProps {
  label: string;
  isOpen: boolean;
  className?: string;
}

const SidebarTrigger: React.FC<SidebarTriggerProps> = React.memo(({ label, isOpen, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-1 text-base transition-colors',
        'text-text-secondary hover:bg-nav-item-hover',
        'group min-h-6 cursor-pointer',
        className
      )}>
      <span className="">{label}</span>

      <div
        className={cn(
          'text-icon-color text-3xs -rotate-90 transition-transform duration-200',
          isOpen && 'rotate-0'
        )}>
        <CaretDown />
      </div>
    </div>
  );
});

SidebarTrigger.displayName = 'SidebarTrigger';

interface SortableSidebarItemProps {
  item: ISidebarGroup['items'][0];
  active?: boolean;
}

const SortableSidebarItem: React.FC<SortableSidebarItemProps> = React.memo(({ item, active }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: item.disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1
  };

  const handleClick = useMemoizedFn((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(isDragging && 'pointer-events-none')}>
      <div onClick={isDragging ? (e) => e.stopPropagation() : undefined}>
        <SidebarItem {...item} active={active} />
      </div>
    </div>
  );
});

SortableSidebarItem.displayName = 'SortableSidebarItem';

export const SidebarCollapsible: React.FC<
  ISidebarGroup & {
    useCollapsible?: boolean;
    activeItem?: string;
    onItemsReorder?: (ids: string[]) => void;
  }
> = React.memo(
  ({
    label,
    items,
    isSortable = false,
    activeItem,
    onItemsReorder,
    variant = 'collapsible',
    icon,
    defaultOpen = true,
    useCollapsible,
    triggerClassName,
    className
  }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const [sortedItems, setSortedItems] = React.useState(items);
    const [draggingId, setDraggingId] = React.useState<string | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 2
        }
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );

    const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
      setDraggingId(event.active.id as string);
    });

    const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
      const { active, over } = event;
      setDraggingId(null);

      if (active.id !== over?.id) {
        setSortedItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over?.id);
          const moveddArray = arrayMove(items, oldIndex, newIndex);
          onItemsReorder?.(moveddArray.map((item) => item.id));
          return moveddArray;
        });
      }
    });

    const draggingItem = draggingId ? sortedItems.find((item) => item.id === draggingId) : null;

    useEffect(() => {
      setSortedItems(items);
    }, [items]);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-0.5">
        {variant === 'collapsible' && (
          <CollapsibleTrigger
            asChild
            className={cn(useCollapsible && COLLAPSED_HIDDEN, 'w-full', triggerClassName)}>
            <button type="button" className="w-full cursor-pointer text-left">
              <SidebarTrigger label={label} isOpen={isOpen} />
            </button>
          </CollapsibleTrigger>
        )}

        {variant === 'icon' && (
          <div
            className={cn(
              'flex items-center space-x-2.5 px-1.5 py-1 text-base',
              'text-text-secondary'
            )}>
            {icon && <span className="text-icon-color text-icon-size">{icon}</span>}
            <span className="">{label}</span>
          </div>
        )}

        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up pl-0">
          <div className="space-y-0.5">
            {isSortable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={modifiers}>
                <SortableContext
                  items={sortedItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}>
                  {sortedItems.map((item) => (
                    <SortableSidebarItem
                      key={item.id}
                      item={item}
                      active={activeItem === item.id || item.active}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {draggingId && draggingItem ? (
                    <div className="opacity-70 shadow">
                      <SidebarItem {...draggingItem} active={draggingItem.active} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              items.map((item) => (
                <SidebarItem
                  key={item.id + item.route}
                  {...item}
                  active={activeItem === item.id || item.active}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

SidebarCollapsible.displayName = 'SidebarCollapsible';
