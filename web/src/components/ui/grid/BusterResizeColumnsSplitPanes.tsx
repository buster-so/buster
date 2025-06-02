'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/classMerge';

const TOTAL_COLUMNS = 12;
const MIN_COLUMN_SPAN = 3;
const MAX_COLUMN_SPAN = 12;

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

  // Calculate if resizing should be enabled based on item count and props
  const canResize = useMemo(() => {
    if (!allowResize || disabled) return false;
    const itemCount = children.length;
    return itemCount >= 2 && itemCount <= 3; // Only allow resize for 2-3 items
  }, [allowResize, disabled, children.length]);

  // Use refs to maintain stable references for event handlers
  const dragStateRef = useRef(dragState);
  const onChangeRef = useRef(onChange);
  const onDragEndRef = useRef(onDragEnd);
  const columnSpansRef = useRef(columnSpans);

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
    columnSpansRef.current = columnSpans;
  }, [columnSpans]);

  // Calculate column positions for the markers
  const columnPositions = useMemo(() => {
    const positions: number[] = [];

    for (let i = 0; i <= TOTAL_COLUMNS; i++) {
      positions.push((i / TOTAL_COLUMNS) * 100);
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
    for (let span = MIN_COLUMN_SPAN; span <= totalSpanBeingResized - MIN_COLUMN_SPAN; span++) {
      const position = accumulatedBefore + span;
      if (position >= MIN_COLUMN_SPAN && position <= TOTAL_COLUMNS - MIN_COLUMN_SPAN) {
        visiblePositions.push(position);
      }
    }

    return Array.from(new Set(visiblePositions)).sort((a, b) => a - b);
  }, [dragState, columnSpans]);

  // Calculate the fluid position based on mouse position (no snapping during drag)
  const calculateFluidPosition = useCallback((mouseX: number, containerWidth: number) => {
    const percentage = (mouseX / containerWidth) * 100;
    const columnPosition = (percentage / 100) * TOTAL_COLUMNS;
    return Math.max(0, Math.min(TOTAL_COLUMNS, columnPosition));
  }, []);

  // Calculate the snap position for final positioning (used only on drag end)
  const calculateSnapPosition = useCallback((position: number) => {
    return Math.round(position);
  }, []);

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
    return calculateSnapPosition(fluidPosition);
  }, [dragState, calculateSnapPosition]);

  // Mouse move handler using refs
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (
        !currentDragState.isDragging ||
        currentDragState.dragIndex === null ||
        !containerRef.current
      )
        return;

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
        leftColumnSpan >= MIN_COLUMN_SPAN &&
        leftColumnSpan <= MAX_COLUMN_SPAN &&
        rightColumnSpan >= MIN_COLUMN_SPAN &&
        rightColumnSpan <= MAX_COLUMN_SPAN
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

  // Mouse up handler using refs
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState.isDragging) return;

      // Clean up
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Apply snapping to the final column spans
      const snappedColumnSpans = [...currentDragState.currentColumnSpans];
      snappedColumnSpans[currentDragState.dragIndex!] = calculateSnapPosition(
        snappedColumnSpans[currentDragState.dragIndex!]
      );
      snappedColumnSpans[currentDragState.dragIndex! + 1] = calculateSnapPosition(
        snappedColumnSpans[currentDragState.dragIndex! + 1]
      );

      // Ensure the total still equals the original total
      const originalTotal =
        currentDragState.startColumnSpans[currentDragState.dragIndex!] +
        currentDragState.startColumnSpans[currentDragState.dragIndex! + 1];
      const snappedTotal =
        snappedColumnSpans[currentDragState.dragIndex!] +
        snappedColumnSpans[currentDragState.dragIndex! + 1];

      // Adjust if rounding caused a discrepancy
      if (snappedTotal !== originalTotal) {
        const difference = originalTotal - snappedTotal;
        snappedColumnSpans[currentDragState.dragIndex! + 1] += difference;
      }

      // Finalize the change with snapped values
      onChangeRef.current?.(snappedColumnSpans);
      onDragEndRef.current?.(event);

      setDragState({
        isDragging: false,
        dragIndex: null,
        startX: 0,
        startColumnSpans: [],
        currentColumnSpans: columnSpansRef.current
      });
    },
    [handleMouseMove, calculateSnapPosition]
  );

  // Handle mouse down on sash
  const handleMouseDown = useCallback(
    (event: React.MouseEvent, sashIndex: number) => {
      if (!canResize) return;

      event.preventDefault();

      const startX = event.clientX;
      const newDragState: DragState = {
        isDragging: true,
        dragIndex: sashIndex,
        startX,
        startColumnSpans: [...columnSpans],
        currentColumnSpans: [...columnSpans]
      };

      setDragState(newDragState);
      onDragStart?.(event.nativeEvent);

      // Add global event listeners and set cursor
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [canResize, columnSpans, onDragStart, handleMouseMove, handleMouseUp]
  );

  // Update current column spans when props change
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

  const displayColumnSpans = dragState.isDragging ? dragState.currentColumnSpans : columnSpans;

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
          const widthPercentage = (span / TOTAL_COLUMNS) * 100;

          return (
            <React.Fragment key={index}>
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
                  index={index}
                  active={dragState.isDragging && dragState.dragIndex === index}
                  onMouseDown={(event) => handleMouseDown(event, index)}
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

// Column Markers Component
const ColumnMarkers: React.FC<{
  positions: number[];
  visiblePositions: number[];
  currentSnapPosition: number | null;
}> = ({ positions, visiblePositions, currentSnapPosition }) => {
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
};

// Sash Component
const Sash: React.FC<{
  index: number;
  active: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  canResize: boolean;
}> = ({ index, active, onMouseDown, canResize }) => {
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!canResize) return;
    onMouseDown(event);
  };

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
};
