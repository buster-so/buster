'use client';

import { useMemoizedFn, useMouse } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import SplitPane, { Pane } from '../layouts/AppSplitter/SplitPane';
import { BusterDragColumnMarkers } from './_BusterDragColumnMarkers';
import { BusterSortableItemDragContainer } from './_BusterSortableItemDragContainer';
import { calculateColumnSpan, columnSpansToPercent } from './helpers';
import type { ResizeableGridDragItem } from './interfaces';
import '../layouts/AppSplitter/splitterStyles.css';

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
  const [isDragginResizeColumn, setIsDraggingResizeColumn] = useState<number | null>(null);
  const columnMarkerColumnIndex = useMemo(
    () => (typeof isDragginResizeColumn === 'number' ? isDragginResizeColumn + 1 : null),
    [isDragginResizeColumn]
  );
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

  //NEW LOGIC
  const [_sizes, setSizes] = useState<(number | string)[]>(columnSpansToPercent(columnSizes));
  const sizes = _sizes.length === items.length ? _sizes : columnSpansToPercent(columnSizes);
  const [stagedLayoutColumns, setStagedLayoutColumns] = useState<number[]>([]);

  const activeDragId = active?.id;
  const activeIndex = useMemo(() => {
    return activeDragId ? items.findIndex((item) => item.id === active?.id) : -1;
  }, [activeDragId, items, active?.id]);

  const onChangeLayout = useMemoizedFn((sizes: number[]) => {
    setSizes(sizes);
    setStagedLayoutColumns(calculateColumnSpan(sizes));
  });

  const onDragEnd = useMemoizedFn(() => {
    setIsDraggingResizeColumn(null);
    const sizesFromColumnSpans = columnSpansToPercent(stagedLayoutColumns);
    setSizes(sizesFromColumnSpans);
    onRowLayoutChange(stagedLayoutColumns, rowId);
  });

  const onDragStart = useMemoizedFn((e: MouseEvent) => {
    const srcElement = e.target as HTMLElement;
    const idOrSrcElement = srcElement?.id;
    if (idOrSrcElement) {
      const parsedId = Number.parseInt(idOrSrcElement);
      if (typeof parsedId === 'number') {
        setIsDraggingResizeColumn(parsedId);
      }
    }
  });

  const sashRender = useMemoizedFn((index: number, active: boolean) => {
    return (
      <ColumnSash
        allowEdit={!readOnly && canResize}
        isDraggingId={isDragginResizeColumn}
        active={active}
        index={index}
      />
    );
  });

  useLayoutEffect(() => {
    setSizes(columnSpansToPercent(columnSizes));
  }, [items.length, columnSizes]);

  return (
    <SortableContext id={rowId} items={items} disabled={false}>
      <div
        ref={setNodeRef}
        className="buster-resize-columns relative h-full w-full"
        data-testid={`buster-resize-columns-${rowIndex}`}>
        <BusterDragColumnMarkers
          isDraggingIndex={columnMarkerColumnIndex}
          itemsLength={items.length}
          stagedLayoutColumns={stagedLayoutColumns}
          disabled={!canResize}
        />

        <SplitPane
          autoSizeId="resize-column"
          split="vertical"
          sizes={sizes}
          allowResize={!readOnly && canResize}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          sashRender={sashRender}
          onChange={onChangeLayout}>
          {items.map((item, index) => (
            <Pane
              className={cn(
                'overflow-visible!',
                index !== items.length - 1 ? 'pr-1.5' : 'pr-0',
                index !== 0 ? 'pl-1.5' : 'pl-0'
              )}
              key={item.id}
              minSize={'25%'}>
              <div className="relative h-full w-full" data-testid={`pane-${index}`}>
                <DropzonePlaceholder
                  right={false}
                  isDropzoneActives={isDropzoneActives}
                  active={
                    !!over && insertPosition(item.id, index, mouse.clientX) === Position.Before
                  }
                />
                <BusterSortableItemDragContainer itemId={item.id} allowEdit={!readOnly}>
                  {item.children}
                </BusterSortableItemDragContainer>
                <DropzonePlaceholder
                  right={true}
                  isDropzoneActives={isDropzoneActives}
                  active={
                    !!over && insertPosition(item.id, index, mouse.clientX) === Position.After
                  }
                />
              </div>
            </Pane>
          ))}
        </SplitPane>
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

const ColumnSash: React.FC<{
  index: number;
  active: boolean;
  isDraggingId: number | null;
  allowEdit: boolean;
}> = React.memo(({ active, allowEdit, isDraggingId, index }) => {
  return (
    <div
      className={cn(
        'grid-column-sash h-full w-1 rounded-lg',
        'z-10 transition-colors duration-200 ease-in-out',
        allowEdit ? 'hover:bg-border' : 'hidden',
        active ? 'bg-border' : '',
        isDraggingId === index ? 'bg-primary!' : ''
      )}
      id={index.toString()}
    />
  );
});
ColumnSash.displayName = 'ColumnSash';
