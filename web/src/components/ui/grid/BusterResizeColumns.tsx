'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import React, { useMemo, useState } from 'react';
import { useMemoizedFn, useMouse } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { BusterSortableItemDragContainer } from './_BusterSortableItemDragContainer';
import type { ResizeableGridDragItem } from './interfaces';
import { BusterResizeColumnsSplitPanes } from './BusterResizeColumnsSplitPanes';

type ContainerProps = {
  rowId: string;
  items: ResizeableGridDragItem[];
  index: number;
  columnSizes: number[] | undefined;
  readOnly?: boolean;
  onRowLayoutChange: (layout: number[], rowId: string) => void;
  fluid?: boolean;
};

export const BusterResizeColumns: React.FC<ContainerProps> = ({
  rowId,
  onRowLayoutChange = () => {},
  index: rowIndex,
  columnSizes,
  readOnly = true,
  items = [],
  fluid = true
}) => {
  const { setNodeRef, isOver, active, over } = useSortable({
    id: rowId,
    disabled: readOnly
  });
  const mouse = useMouse({ moveThrottleMs: 50, disabled: readOnly || !over });
  const [stagedLayoutColumns, setStagedLayoutColumns] = useState<number[]>([]);

  const canResize = useMemo(() => items.length > 1 && items.length < 4, [items.length]);
  const isDropzoneActives = useMemo(() => !!over?.id && canResize, [over?.id, canResize]);

  const insertPosition = useMemoizedFn((itemId: string, _index: number, mouseLeft: number) => {
    const movedIndex = _index;

    // If the item is the only one in the container, don't show any dropzones
    if (active?.data.current?.sortable?.containerId === rowId && items.length === 1) {
      return undefined;
    }

    if (active?.data.current?.sortable?.containerId === over?.data.current?.sortable?.containerId) {
      const res =
        over?.id === itemId
          ? movedIndex > activeIndex
            ? Position.After
            : Position.Before
          : undefined;

      return res;
    }

    const isLastItem =
      over?.id === itemId && over?.data.current?.sortable?.index === items.length - 1;

    if (isLastItem) {
      const widthOfItem = over?.rect.width;
      const leftSideOfItem = over?.rect.left;
      const isOverLeftHalf = mouseLeft < leftSideOfItem + widthOfItem / 2;

      if (isOverLeftHalf) {
        return Position.Before;
      }

      return Position.After;
    }

    const res =
      over?.id === itemId
        ? movedIndex > over?.data.current?.sortable?.index
          ? Position.After
          : Position.Before
        : undefined;

    return res;
  });

  const activeDragId = active?.id;
  const activeIndex = useMemo(() => {
    return activeDragId ? items.findIndex((item) => item.id === active?.id) : -1;
  }, [activeDragId, items, active?.id]);

  const onChangeLayout = useMemoizedFn((newColumnSpans: number[]) => {
    setStagedLayoutColumns(newColumnSpans);
  });

  const onDragEnd = useMemoizedFn(() => {
    onRowLayoutChange(stagedLayoutColumns, rowId);
  });

  const onDragStart = useMemoizedFn(() => {
    // Optional: Add any additional drag start logic
  });

  return (
    <SortableContext id={rowId} items={items} disabled={false}>
      <div
        ref={setNodeRef}
        className="buster-resize-columns relative h-full w-full"
        data-testid={`buster-resize-columns-${rowIndex}`}>
        <BusterResizeColumnsSplitPanes
          columnSpans={columnSizes || []}
          allowResize={!readOnly && canResize}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onChange={onChangeLayout}>
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'relative h-full w-full',
                index !== items.length - 1 ? 'pr-1.5' : 'pr-0',
                index !== 0 ? 'pl-1.5' : 'pl-0'
              )}
              data-testid={`pane-${index}`}>
              <DropzonePlaceholder
                right={false}
                isDropzoneActives={isDropzoneActives}
                active={!!over && insertPosition(item.id, index, mouse.clientX) === Position.Before}
              />
              <BusterSortableItemDragContainer itemId={item.id} allowEdit={!readOnly}>
                {item.children}
              </BusterSortableItemDragContainer>
              <DropzonePlaceholder
                right={true}
                isDropzoneActives={isDropzoneActives}
                active={!!over && insertPosition(item.id, index, mouse.clientX) === Position.After}
              />
            </div>
          ))}
        </BusterResizeColumnsSplitPanes>
      </div>
    </SortableContext>
  );
};

export enum Position {
  Before = -1,
  After = 1
}

const DropzonePlaceholder: React.FC<{
  active: boolean;
  right: boolean;
  isDropzoneActives: boolean;
}> = React.memo(({ active, right, isDropzoneActives }) => {
  const memoizedStyle = useMemo(() => {
    return {
      right: right ? -7.5 : undefined,
      left: right ? undefined : -7.5,
      opacity: active || isDropzoneActives ? 1 : 0
    };
  }, [active, isDropzoneActives, right]);

  return (
    <div
      className={cn(
        'bg-nav-item-hover pointer-events-none absolute top-0 bottom-0 z-[1] h-full w-1 rounded-lg transition-opacity duration-200',
        isDropzoneActives && 'placeholder',
        active && 'bg-primary! z-10 opacity-100'
      )}
      style={memoizedStyle}
      data-testid={`dropzone-placeholder-${right ? 'right' : 'left'}`}
    />
  );
});
DropzonePlaceholder.displayName = 'DropzonePlaceholder';
