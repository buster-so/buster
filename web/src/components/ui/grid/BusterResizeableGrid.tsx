'use client';

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  getFirstCollision,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMemoizedFn, useUpdateEffect } from '@/hooks';
import { cn } from '@/lib/utils';
import { BusterSortableOverlay } from './_BusterSortableOverlay';
import { BusterResizeRows } from './BusterResizeRows';
import { MIN_ROW_HEIGHT, NEW_ROW_ID, NUMBER_OF_COLUMNS, TOP_SASH_ID } from './helpers';
import type { BusterResizeableGridRow } from './interfaces';

const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always
  }
};

const pointerSensors = {
  activationConstraint: {
    distance: 2
  }
};

export const BusterResizeableGrid: React.FC<{
  className?: string;
  rows: BusterResizeableGridRow[];
  onRowLayoutChange: (newLayout: BusterResizeableGridRow[]) => void;
  onStartDrag?: (d: { id: string }) => void;
  onEndDrag?: (d: { id: string }) => void;
  overlayComponent?: React.ReactNode;
  readOnly?: boolean;
}> = React.memo(
  ({
    readOnly = true,
    className = '',
    overlayComponent,
    rows: serverRows,
    onRowLayoutChange,
    onStartDrag,
    onEndDrag
  }) => {
    const [rows, setRows] = useState<BusterResizeableGridRow[]>(() => newRowPreflight(serverRows));
    const styleRef = useRef<HTMLStyleElement>(undefined);
    console.log(rows, serverRows);

    const onRowLayoutChangePreflight = useMemoizedFn((newLayout: BusterResizeableGridRow[]) => {
      const filteredRows = newRowPreflight(newLayout);
      if (checkRowEquality(filteredRows, rows)) {
        return;
      }
      onRowLayoutChange(filteredRows);
      setRows(filteredRows);
    });

    //Dnd Kit stuff
    const [activeId, setActiveId] = useState<string | null>(null);
    const lastOverId = useRef<string | null>(null);
    const recentlyMovedToNewContainer = useRef(false);
    const isAnimating = useRef(false);

    const sensors = useSensors(useSensor(PointerSensor, pointerSensors));

    const collisionDetectionStrategy: CollisionDetection = useMemoizedFn((args) => {
      if (activeId && rows.some((row) => row.id === activeId)) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            rows.map((v) => v.id).includes(container.id as string)
          )
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : []; //rectIntersection(args);

      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (rows.some((row) => row.id === overId)) {
          const containerItems = rows.find((row) => row.id === overId)?.items || [];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  containerItems.map((v) => v.id).includes(container.id as string)
              )
            })[0]?.id;
          }
        }

        lastOverId.current = overId as string;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    });

    const findContainer = useMemoizedFn((id: string) => {
      if (rows.some((row) => row.id === id)) {
        return id;
      }

      return rows.find((row) => row.items.some((item) => item.id === id))?.id;
    });

    const onDragCancel = useMemoizedFn(() => {
      if (serverRows) {
        // Reset items to their original state in case items have been
        // Dragged across containers
        onRowLayoutChangePreflight(serverRows);
      }

      setActiveId(null);
    });

    const onDragStart = useMemoizedFn(({ active }: DragStartEvent) => {
      const style = document.createElement('style');
      style.innerHTML = '* { cursor: grabbing; }';
      document.head.appendChild(style);
      styleRef.current = style;
      setActiveId(active.id as string);
      onStartDrag?.({ id: active.id as string });
      isAnimating.current = true;
    });

    const onDragEnd = useMemoizedFn(
      ({ over, active, delta, activatorEvent, collisions }: DragEndEvent) => {
        document.body.style.cursor = '';
        if (styleRef.current) {
          document.head.removeChild(styleRef.current);
        }
        const activeContainer = findContainer(active.id as string);
        onEndDrag?.({ id: active.id as string });

        if (!activeContainer) {
          setActiveId(null);
          return;
        }

        const overId = over?.id as string;

        if (overId == null) {
          setActiveId(null);
          return;
        }

        //COMPLETELY NEW ROW!
        if (overId.includes(NEW_ROW_ID)) {
          const newRowId = uuidv4();
          const newRowDroppedId = over?.data.current?.id;

          const filteredRows = rows.map((row) => {
            if (row.id === activeContainer) {
              return {
                ...row,
                items: row.items.filter((item) => item.id !== active.id)
              };
            }
            return row;
          });
          const newRow =
            rows
              .find((row) => row.id === activeContainer)
              ?.items.filter((item) => item.id === active.id) || [];

          const newRowConfig = {
            id: newRowId,
            items: newRow,
            columnSizes: [12],
            rowHeight: MIN_ROW_HEIGHT
          };

          if (newRowDroppedId === TOP_SASH_ID) {
            return onRowLayoutChangePreflight([newRowConfig, ...filteredRows]);
          }

          if (newRowDroppedId) {
            const numericId = Number.parseInt(newRowDroppedId) + 1;
            const newRows = filteredRows.reduce<BusterResizeableGridRow[]>((acc, row, index) => {
              if (index === numericId) {
                acc.push(newRowConfig);
              }
              acc.push(row);
              return acc;
            }, [] as BusterResizeableGridRow[]);
            return onRowLayoutChangePreflight(newRows);
          }
          return onRowLayoutChangePreflight([...filteredRows, newRowConfig]);
        }

        const overContainer = findContainer(overId as string);
        const numberOfItemsInOverExeeds = over?.data.current?.sortable?.items.length >= 4;

        if (overContainer !== activeContainer && numberOfItemsInOverExeeds) {
          setActiveId(null);
          return;
        }

        if (activeContainer !== overContainer && !overId.includes(NEW_ROW_ID)) {
          const activeItems = rows.find((row) => row.id === activeContainer)?.items || [];
          const overItems = rows.find((row) => row.id === overContainer)?.items || [];
          const overIndex = overItems.findIndex((item) => item.id === overId);
          const activeIndex = activeItems.findIndex((item) => item.id === active.id);

          const isOverLastItem =
            over?.id === overId && over?.data.current?.sortable?.index === overItems.length - 1;
          let modifier = 0;
          if (isOverLastItem) {
            const widthOfItem = over?.rect.width;
            const leftSideOfItem = over?.rect.left;
            const initialMouseX = (activatorEvent as MouseEvent)?.clientX || 0;
            const movedDistanceX = initialMouseX + delta.x;
            const mouseLeft = movedDistanceX;
            const isOverLeftHalf = mouseLeft < leftSideOfItem + widthOfItem / 2;
            modifier = isOverLeftHalf ? 0 : 1;
          }
          const newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;

          recentlyMovedToNewContainer.current = true;

          return onRowLayoutChangePreflight([
            ...rows.map((row) => {
              if (row.id === activeContainer) {
                return {
                  ...row,
                  items: row.items.filter((item) => item.id !== active.id)
                };
              }
              if (row.id === overContainer) {
                return {
                  ...row,
                  items: [
                    ...row.items.slice(0, newIndex),
                    activeItems[activeIndex],
                    ...row.items.slice(newIndex, row.items.length)
                  ]
                };
              }
              return row;
            })
          ]);
        }

        if (overContainer) {
          const activeIndex = rows
            .find((r) => r.id === activeContainer)
            ?.items.findIndex((row) => row.id === active.id);
          const overIndex = rows
            .find((r) => r.id === overContainer)
            ?.items.findIndex((row) => row.id === overId);

          if (activeIndex !== overIndex && activeIndex !== undefined && overIndex !== undefined) {
            const newRows = rows.map((row) => {
              if (row.id === overContainer) {
                return {
                  ...row,
                  items: arrayMove(row.items, activeIndex, overIndex),
                  columnSizes: arrayMove(row.columnSizes || [], activeIndex, overIndex)
                };
              }

              return row;
            });

            onRowLayoutChangePreflight(newRows);
          } else {
            onRowLayoutChangePreflight(rows);
          }
        }

        setActiveId(null);
      }
    );

    useEffect(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          recentlyMovedToNewContainer.current = false;
          isAnimating.current = false;
        }, 50);
      });
    }, [rows]);

    useUpdateEffect(() => {
      if (!checkRowEquality(serverRows, rows) && !isAnimating.current) {
        setRows(serverRows);
      }
    }, [serverRows]);

    return (
      <DndContext
        measuring={measuringConfig}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        collisionDetection={collisionDetectionStrategy}
        sensors={sensors}>
        <div className={cn('buster-resizeable-grid h-full w-full', className)}>
          <BusterResizeRows
            rows={rows}
            className={className}
            readOnly={readOnly}
            onRowLayoutChange={onRowLayoutChangePreflight}
          />
        </div>

        {!readOnly && (
          <BusterSortableOverlay
            activeId={activeId}
            overlayComponent={overlayComponent}
            rows={rows}
          />
        )}
      </DndContext>
    );
  }
);

BusterResizeableGrid.displayName = 'BusterResizeableGrid';

const removeEmptyContainers = (items: BusterResizeableGridRow[]): BusterResizeableGridRow[] => {
  return items.filter((item) => item.items.length > 0 && item.items[0]?.id);
};

const checkRowEquality = (
  newRows: BusterResizeableGridRow[],
  oldRows: BusterResizeableGridRow[]
) => {
  const formattedRows = (rows: BusterResizeableGridRow[]) =>
    JSON.stringify(
      rows
        .filter((v) => v.items[0]?.id)
        .map((row) => {
          return {
            ...row,
            items: row.items.map((item) => ({
              id: item.id
            }))
          };
        })
    );

  const formattedOld = formattedRows(oldRows);
  const formattedNew = formattedRows(newRows);

  return isEqual(formattedOld, formattedNew);
};

const newRowPreflight = (newRows: BusterResizeableGridRow[]) => {
  let newRowsCopy = removeEmptyContainers([...newRows]);

  newRowsCopy = newRowsCopy.map((row, index) => {
    const numberOfColumns = row.columnSizes?.length || 0;
    const numberOfItems = row.items.length;
    row.id = `${index + 1}`; //we use this instead of uuid because the api likes it better this way
    if (
      numberOfItems !== numberOfColumns ||
      row.columnSizes?.reduce((a, b) => a + b, 0) !== NUMBER_OF_COLUMNS
    ) {
      const newColumnSizes = Array.from(
        { length: numberOfItems },
        () => NUMBER_OF_COLUMNS / numberOfItems
      );

      return {
        ...row,
        columnSizes: newColumnSizes
      };
    }
    return row;
  });

  return newRowsCopy;
};
