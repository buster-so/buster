'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/classMerge';
import { NUMBER_OF_COLUMNS, MIN_NUMBER_OF_COLUMNS, MAX_NUMBER_OF_COLUMNS } from './helpers';

interface BusterResizeColumnsSplitPanesProps {
  children: React.ReactNode[];
  columnSpans: number[];
  allowResize?: boolean;
  disabled?: boolean;
  onDragStart?: (event: MouseEvent) => void;
  onDragEnd?: (event: MouseEvent) => void;
  onChange?: (columnSpans: number[]) => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  startX: number;
  startColumnSpans: number[];
  currentColumnSpans: number[];
}

// Move child components outside to prevent recreation on every render
const ColumnMarkers = React.memo<{
  positions: number[];
  visiblePositions: number[];
  currentSnapPosition: number | null;
}>(({ positions, visiblePositions, currentSnapPosition }) => {
  return (
    <div
      className="pointer-events-none absolute -top-2 right-0 left-0 flex h-2 items-center justify-between"
      style={{ transform: 'translateY(-100%)' }}>
      <div className="relative h-full w-full px-1.5">
        {positions.map((position, index) => {
          const isVisible = visiblePositions.includes(index);
          const isActive = currentSnapPosition === index;

          return (
            <div
              key={index}
              className={cn(
                'absolute h-2 w-2 rounded-full transition-all duration-200',
                isActive ? 'bg-primary shadow-primary-light' : 'bg-border',
                'opacity-0',
                isVisible && 'opacity-100'
              )}
              style={{
                left: `${position}%`,
                transform: 'translateX(-50%)'
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

ColumnMarkers.displayName = 'ColumnMarkers';

const Sash = React.memo<{
  index: number;
  active: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  canResize: boolean;
}>(({ index, active, onMouseDown, canResize }) => {
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!canResize) return;
      onMouseDown(event);
    },
    [canResize, onMouseDown]
  );

  return (
    <div
      className={cn(
        'flex h-full w-1 items-center justify-center rounded-lg transition-colors duration-200',
        canResize && 'cursor-col-resize',
        canResize && active && 'bg-primary',
        canResize && !active && 'hover:bg-border'
      )}
      onMouseDown={handleMouseDown}
      data-sash-index={index}></div>
  );
});

Sash.displayName = 'Sash';

export const BusterResizeColumnsSplitPanes: React.FC<BusterResizeColumnsSplitPanesProps> = ({
  children,
  columnSpans,
  allowResize = true,
  disabled = false,
  onDragStart,
  onDragEnd,
  onChange,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    startX: 0,
    startColumnSpans: [],
    currentColumnSpans: columnSpans
  });

  // Use refs to maintain stable references for event handlers and avoid stale closures
  const dragStateRef = useRef(dragState);
  const onChangeRef = useRef(onChange);
  const onDragEndRef = useRef(onDragEnd);
  const onDragStartRef = useRef(onDragStart);

  // Update refs when values change
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  useEffect(() => {
    onDragStartRef.current = onDragStart;
  }, [onDragStart]);

  // Calculate if resizing should be enabled based on item count and props
  const canResize = useMemo(() => {
    if (!allowResize || disabled) return false;
    const itemCount = children.length;
    return itemCount >= 2 && itemCount <= 3; // Only allow resize for 2-3 items
  }, [allowResize, disabled, children.length]);

  // Memoize column positions calculation
  const columnPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i <= NUMBER_OF_COLUMNS; i++) {
      positions.push((i / NUMBER_OF_COLUMNS) * 100);
    }
    return positions;
  }, []);

  // Calculate which column positions should be visible during drag
  const visibleColumnPositions = useMemo(() => {
    if (!dragState.isDragging || dragState.dragIndex === null) return [];

    const { dragIndex } = dragState;
    const visiblePositions: number[] = [];

    // Calculate accumulated span before the drag point
    let accumulatedBefore = 0;
    for (let i = 0; i < dragIndex; i++) {
      accumulatedBefore += columnSpans[i];
    }

    // Calculate total span of the two columns being resized
    const totalSpanBeingResized = columnSpans[dragIndex] + columnSpans[dragIndex + 1];

    // Show valid snap positions within the resizing area
    for (
      let span = MIN_NUMBER_OF_COLUMNS;
      span <= totalSpanBeingResized - MIN_NUMBER_OF_COLUMNS;
      span++
    ) {
      const position = accumulatedBefore + span;
      if (
        position >= MIN_NUMBER_OF_COLUMNS &&
        position <= NUMBER_OF_COLUMNS - MIN_NUMBER_OF_COLUMNS
      ) {
        visiblePositions.push(position);
      }
    }

    return Array.from(new Set(visiblePositions)).sort((a, b) => a - b);
  }, [dragState.isDragging, dragState.dragIndex, columnSpans]);

  // Calculate current snap position during drag (shows where it will snap to)
  const currentSnapPosition = useMemo(() => {
    if (!dragState.isDragging || dragState.dragIndex === null) return null;

    let accumulatedBefore = 0;
    for (let i = 0; i < dragState.dragIndex; i++) {
      accumulatedBefore += dragState.currentColumnSpans[i];
    }

    // Calculate the fluid position
    const fluidPosition = accumulatedBefore + dragState.currentColumnSpans[dragState.dragIndex];

    // Return the position it will snap to (rounded)
    return Math.round(fluidPosition);
  }, [dragState.isDragging, dragState.dragIndex, dragState.currentColumnSpans]);

  // Memoize display column spans
  const displayColumnSpans = useMemo(() => {
    return dragState.isDragging ? dragState.currentColumnSpans : columnSpans;
  }, [dragState.isDragging, dragState.currentColumnSpans, columnSpans]);

  // Calculate fluid position based on mouse position (no snapping during drag)
  const calculateFluidPosition = useCallback((mouseX: number, containerWidth: number) => {
    const percentage = (mouseX / containerWidth) * 100;
    const columnPosition = (percentage / 100) * NUMBER_OF_COLUMNS;
    return Math.max(0, Math.min(NUMBER_OF_COLUMNS, columnPosition));
  }, []);

  // Mouse move handler - using refs to avoid stale closures
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (
        !currentDragState.isDragging ||
        currentDragState.dragIndex === null ||
        !containerRef.current
      ) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const fluidPosition = calculateFluidPosition(
        event.clientX - containerRect.left,
        containerRect.width
      );

      // Calculate new column spans based on fluid position (no snapping)
      const newColumnSpans = [...currentDragState.startColumnSpans];
      const { dragIndex } = currentDragState;

      // Calculate accumulated span before the drag index
      let accumulatedBefore = 0;
      for (let i = 0; i < dragIndex; i++) {
        accumulatedBefore += newColumnSpans[i];
      }

      // Calculate new spans for the two columns being resized (fluid)
      const leftColumnSpan = fluidPosition - accumulatedBefore;
      const rightColumnSpan =
        newColumnSpans[dragIndex] + newColumnSpans[dragIndex + 1] - leftColumnSpan;

      // Validate constraints (but allow fluid movement within bounds)
      if (
        leftColumnSpan >= MIN_NUMBER_OF_COLUMNS &&
        leftColumnSpan <= MAX_NUMBER_OF_COLUMNS &&
        rightColumnSpan >= MIN_NUMBER_OF_COLUMNS &&
        rightColumnSpan <= MAX_NUMBER_OF_COLUMNS
      ) {
        newColumnSpans[dragIndex] = leftColumnSpan;
        newColumnSpans[dragIndex + 1] = rightColumnSpan;

        setDragState((prev) => ({
          ...prev,
          currentColumnSpans: newColumnSpans
        }));
      }
    },
    [calculateFluidPosition]
  );

  // Mouse up handler - using refs to avoid stale closures
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState.isDragging || currentDragState.dragIndex === null) return;

      // Clean up
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Apply snapping to the final column spans
      const snappedColumnSpans = [...currentDragState.currentColumnSpans];
      snappedColumnSpans[currentDragState.dragIndex] = Math.round(
        snappedColumnSpans[currentDragState.dragIndex]
      );
      snappedColumnSpans[currentDragState.dragIndex + 1] = Math.round(
        snappedColumnSpans[currentDragState.dragIndex + 1]
      );

      // Ensure the total still equals the original total
      const originalTotal =
        currentDragState.startColumnSpans[currentDragState.dragIndex] +
        currentDragState.startColumnSpans[currentDragState.dragIndex + 1];
      const snappedTotal =
        snappedColumnSpans[currentDragState.dragIndex] +
        snappedColumnSpans[currentDragState.dragIndex + 1];

      // Adjust if rounding caused a discrepancy
      if (snappedTotal !== originalTotal) {
        const difference = originalTotal - snappedTotal;
        snappedColumnSpans[currentDragState.dragIndex + 1] += difference;
      }

      // Finalize the change with snapped values
      console.log('onChangeRef', snappedColumnSpans);
      onChangeRef.current?.(snappedColumnSpans);
      onDragEndRef.current?.(event);

      setDragState({
        isDragging: false,
        dragIndex: null,
        startX: 0,
        startColumnSpans: [],
        currentColumnSpans: columnSpans
      });
    },
    [handleMouseMove, columnSpans, onChangeRef, onDragEndRef, dragStateRef]
  );

  // Create stable mouse down handlers for each sash
  const sashHandlers = useMemo(() => {
    return children.slice(0, -1).map((_, index) => (event: React.MouseEvent) => {
      if (!canResize) return;

      event.preventDefault();

      const startX = event.clientX;
      const newDragState: DragState = {
        isDragging: true,
        dragIndex: index,
        startX,
        startColumnSpans: [...columnSpans],
        currentColumnSpans: [...columnSpans]
      };

      setDragState(newDragState);
      onDragStartRef.current?.(event.nativeEvent);

      // Add global event listeners and set cursor
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    });
  }, [canResize, columnSpans, children.length, handleMouseMove, handleMouseUp]);

  // Update current column spans when props change (only if not dragging)
  useEffect(() => {
    if (!dragState.isDragging) {
      setDragState((prev) => ({ ...prev, currentColumnSpans: columnSpans }));
    }
  }, [columnSpans, dragState.isDragging]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className={cn('relative h-full w-full', className)}>
      {/* Column Markers */}
      {dragState.isDragging && (
        <ColumnMarkers
          positions={columnPositions}
          visiblePositions={visibleColumnPositions}
          currentSnapPosition={currentSnapPosition}
        />
      )}

      {/* Columns Container */}
      <div className="flex h-full w-full">
        {children.map((child, index) => {
          const span = displayColumnSpans[index];
          const widthPercentage = (span / NUMBER_OF_COLUMNS) * 100;

          return (
            <React.Fragment key={`column-${index}`}>
              {/* Column */}
              <div
                className="relative h-full transition-all duration-200 ease-out"
                style={{
                  width: `${widthPercentage}%`,
                  transition: dragState.isDragging ? 'none' : 'width 200ms ease-out'
                }}>
                {child}
              </div>

              {/* Sash */}
              {index < children.length - 1 && (
                <Sash
                  key={`sash-${index}`}
                  index={index}
                  active={dragState.isDragging && dragState.dragIndex === index}
                  onMouseDown={sashHandlers[index]}
                  canResize={canResize}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
