import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { type Header, type Table, flexRender } from '@tanstack/react-table';
import React, { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';
import { HEADER_HEIGHT } from './constants';

const ACTIVATION_CONSTRAINT = {
  activationConstraint: {
    distance: 2
  }
};

export const SortColumnWrapper: React.FC<{
  table: Table<Record<string, string | number | Date | null>>;
  draggable: boolean;
  children: React.ReactNode;
  colOrder: string[];
  setColOrder: (colOrder: string[]) => void;
  onReorderColumns?: ((columnIds: string[]) => void) | undefined;
}> = ({ table, draggable, children, colOrder, setColOrder, onReorderColumns }) => {
  // Track active drag item and over target
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overTargetId, setOverTargetId] = useState<string | null>(null);
  // Store active header for overlay rendering
  const [activeHeader, setActiveHeader] = useState<Header<
    Record<string, string | number | Date | null>,
    unknown
  > | null>(null);

  // Reference to the style element for cursor handling
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const memoizedModifiers = useMemo(() => [restrictToHorizontalAxis], []);

  const sensors = useSensors(
    useSensor(MouseSensor, ACTIVATION_CONSTRAINT),
    useSensor(TouchSensor, ACTIVATION_CONSTRAINT),
    useSensor(KeyboardSensor)
  );

  // Handle drag start to capture the active header
  const onDragStart = useMemoizedFn((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Add global cursor style
    const style = document.createElement('style');
    style.innerHTML = '* { cursor: grabbing !important; }';
    document.head.appendChild(style);
    styleRef.current = style;

    // Find and store the active header for the overlay
    const headerIndex = table
      .getHeaderGroups()[0]
      ?.headers.findIndex((header) => header.id === active.id);

    if (headerIndex !== undefined && headerIndex !== -1) {
      setActiveHeader(
        table.getHeaderGroups()[0]?.headers[headerIndex] as Header<
          Record<string, string | number | Date | null>,
          unknown
        >
      );
    }
  });

  // Handle drag over to highlight the target
  const onDragOver = useMemoizedFn((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Extract the actual header ID from the droppable ID
      const headerId = over.id.toString().replace('droppable-', '');
      setOverTargetId(headerId);
    } else {
      setOverTargetId(null);
    }
  });

  // Handle drag end to reorder columns.
  const onDragEnd = useMemoizedFn((event: DragEndEvent) => {
    const { active, over } = event;

    // Remove global cursor style
    if (styleRef.current) {
      document.head.removeChild(styleRef.current);
      styleRef.current = null;
    }

    // Reset states immediately to prevent animation
    setActiveId(null);
    setActiveHeader(null);
    setOverTargetId(null);

    if (active && over) {
      // Extract the actual header ID from the droppable ID
      const overId = over.id.toString().replace('droppable-', '');

      if (active.id !== overId) {
        const oldIndex = colOrder.indexOf(active.id as string);
        const newIndex = colOrder.indexOf(overId);
        const newOrder = arrayMove(colOrder, oldIndex, newIndex);
        setColOrder(newOrder);
        if (onReorderColumns) onReorderColumns(newOrder);
      }
    }
  });

  // Clean up any styles on unmount
  useEffect(() => {
    return () => {
      // Clean up cursor style if component unmounts during a drag
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  if (!draggable) return <>{children}</>;

  return (
    <DndContext
      sensors={sensors}
      modifiers={memoizedModifiers}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}>
      <SortColumnContext.Provider value={{ overTargetId }}>
        {children}

        <DragOverlay
          wrapperElement="span"
          adjustScale={false}
          dropAnimation={null} // Using null to completely disable animation
          zIndex={1000}>
          {activeId && activeHeader && <HeaderDragOverlay header={activeHeader} />}
        </DragOverlay>
      </SortColumnContext.Provider>
    </DndContext>
  );
};

SortColumnWrapper.displayName = 'SortColumnWrapper';

type SortColumnContextType = {
  overTargetId: string | null;
};

export const SortColumnContext = createContext<SortColumnContextType>({
  overTargetId: null
});

export const useSortColumnContext = <T,>(selector: (ctx: SortColumnContextType) => T): T => {
  const context = useContext(SortColumnContext);
  return selector(context);
};

// Header content component to use in the DragOverlay
const HeaderDragOverlay = ({
  header
}: {
  header: Header<Record<string, string | number | Date | null>, unknown>;
}) => {
  return (
    <div
      className="flex items-center rounded-sm border bg-white p-2 shadow-lg"
      style={{
        width: header.column.getSize(),
        height: `${HEADER_HEIGHT}px`,
        opacity: 0.85,
        transform: 'translate3d(0, 0, 0)', // Ensure no unexpected transforms are applied
        pointerEvents: 'none' // Prevent the overlay from intercepting pointer events
      }}>
      {flexRender(header.column.columnDef.header, header.getContext())}
      {header.column.getIsSorted() === 'asc' && <span> 🔼</span>}
      {header.column.getIsSorted() === 'desc' && <span> 🔽</span>}
    </div>
  );
};
