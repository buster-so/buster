'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { BusterResizeableGridRow } from './interfaces';
import { BusterResizeColumns } from './BusterResizeColumns';
import { BusterNewItemDropzone } from './_BusterBusterNewItemDropzone';
import { MIN_ROW_HEIGHT, TOP_SASH_ID, NEW_ROW_ID, MAX_ROW_HEIGHT } from './helpers';
import clamp from 'lodash/clamp';
import { useDebounceFn, useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/classMerge';

export const BusterResizeRows: React.FC<{
  rows: BusterResizeableGridRow[];
  className: string;
  readOnly?: boolean;
  onRowLayoutChange: (rows: BusterResizeableGridRow[]) => void;
}> = ({ readOnly = false, rows, className, onRowLayoutChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggingResizeId, setIsDraggingResizeId] = useState<number | null>(null);
  const [sizes, setSizes] = useState<number[]>(rows.map((r) => r.rowHeight ?? MIN_ROW_HEIGHT));

  const { run: handleRowLayoutChangeDebounced } = useDebounceFn(
    useMemoizedFn((sizes: number[]) => {
      const newRows = rows.map((r, index) => ({
        ...r,
        rowHeight: sizes[index]
      }));
      onRowLayoutChange(newRows);
    }),
    { wait: 375 }
  );

  const handleResize = useMemoizedFn((index: number, size: number) => {
    const newSizes = [...sizes];
    newSizes[index] = size;
    setSizes(newSizes);
    handleRowLayoutChangeDebounced(newSizes);
  });

  const onRowLayoutChangePreflight = useMemoizedFn((columnSizes: number[], rowId: string) => {
    const newRows: BusterResizeableGridRow[] = rows.map((r) => {
      if (r.id === rowId) {
        return { ...r, columnSizes };
      }
      return r;
    });

    onRowLayoutChange(newRows);
  });

  useUpdateLayoutEffect(() => {
    setSizes(rows.map((r) => r.rowHeight ?? MIN_ROW_HEIGHT));
  }, [rows.length]);

  return (
    <div
      ref={ref}
      className={cn(
        className,
        'buster-resize-row relative',
        'mb-10 flex h-full w-full flex-col space-y-3 transition',
        'opacity-100'
      )}>
      <ResizeRowHandle
        id={TOP_SASH_ID}
        top={true}
        sizes={sizes}
        active={false}
        setIsDraggingResizeId={setIsDraggingResizeId}
        onResize={handleResize}
        readOnly={readOnly}
      />

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="relative h-full w-full"
          style={{
            height: sizes[index]
          }}>
          <BusterResizeColumns
            rowId={row.id}
            items={row.items}
            index={index}
            readOnly={readOnly}
            columnSizes={row.columnSizes}
            onRowLayoutChange={onRowLayoutChangePreflight}
          />

          <ResizeRowHandle
            id={index.toString()}
            index={index}
            sizes={sizes}
            active={isDraggingResizeId === index}
            setIsDraggingResizeId={setIsDraggingResizeId}
            onResize={handleResize}
            readOnly={readOnly}
            hideDropzone={index === rows.length - 1}
          />
        </div>
      ))}

      {!readOnly && <BusterNewItemDropzone />}
    </div>
  );
};

const ResizeRowHandle: React.FC<{
  id: string;
  index?: number;
  sizes: number[];
  setIsDraggingResizeId: (index: number | null) => void;
  onResize: (index: number, size: number) => void;
  readOnly: boolean;
  active: boolean;
  top?: boolean; //if true we will not use dragging, just dropzone
  hideDropzone?: boolean;
}> = React.memo(
  ({ hideDropzone, top, id, active, readOnly, setIsDraggingResizeId, index, sizes, onResize }) => {
    const { setNodeRef, isOver, over } = useDroppable({
      id: `${NEW_ROW_ID}_${id}}`,
      disabled: readOnly,
      data: { id }
    });
    const showDropzone = !!over?.id && !hideDropzone;
    const isDropzoneActive = showDropzone && isOver;

    const handler = useMemoizedFn((mouseDownEvent: React.MouseEvent<HTMLDivElement>) => {
      if (!index) return;
      const startPosition = mouseDownEvent.pageY;
      const style = document.createElement('style');
      style.innerHTML = '* { cursor: row-resize; }';
      document.head.appendChild(style);
      setIsDraggingResizeId(index);

      function onMouseMove(mouseMoveEvent: MouseEvent) {
        if (!index) return;
        const newSize = sizes[index] + (mouseMoveEvent.pageY - startPosition);
        const clampedSize = clamp(newSize, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
        onResize(index, clampedSize);
      }
      function onMouseUp() {
        document.body.removeEventListener('mousemove', onMouseMove);
        style.remove();
        setIsDraggingResizeId(null);
      }

      document.body.addEventListener('mousemove', onMouseMove);
      document.body.addEventListener('mouseup', onMouseUp, { once: true });
    });

    const onMouseDown = top ? undefined : handler;

    const memoizedStyle = useMemo(() => {
      return {
        zIndex: 1,
        bottom: !top ? -4 : -4,
        transform: !top ? 'translateY(100%)' : 'translateY(100%)'
      };
    }, [top]);

    const showActive = (active || isDropzoneActive) && !readOnly;

    return (
      <div className="relative">
        <div
          id={id}
          className={cn(
            !readOnly && 'hover:bg-border cursor-row-resize',
            showActive && 'bg-primary! z-10 opacity-100',
            'h-1 w-full rounded-sm transition-colors duration-200 ease-in-out select-none',
            !top && 'dragger absolute'
          )}
          style={memoizedStyle}
          onMouseDown={onMouseDown}
        />
        <div
          className={cn(
            'pointer-events-none absolute right-0 left-0 z-50 h-[54px] opacity-0',
            top ? '-top-[36px]' : '-bottom-[15px]'
          )}
          ref={setNodeRef}
        />
      </div>
    );
  }
);

ResizeRowHandle.displayName = 'ResizeRowHandle';
