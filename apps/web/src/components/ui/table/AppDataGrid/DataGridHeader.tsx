import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Header, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import type React from 'react';
import type { CSSProperties } from 'react';
import CaretDown from '@/components/ui/icons/NucleoIconFilled/caret-down';
import CaretUp from '@/components/ui/icons/NucleoIconFilled/caret-up';
import { cn } from '@/lib/classMerge';
import { HEADER_HEIGHT } from './constants';
import { useSortColumnContext } from './SortColumnWrapper';

interface DraggableHeaderProps {
  header: Header<Record<string, string | number | Date | null>, unknown>;
  resizable: boolean;
  sortable: boolean;
  isOverTarget: boolean;
  draggable: boolean;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({
  header,
  sortable,
  resizable,
  isOverTarget,
  draggable,
}) => {
  // Set up dnd-kit's useDraggable for this header cell
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDragNodeRef,
  } = useDraggable({
    disabled: !draggable,
    id: header.id,
  });

  // Set up droppable area to detect when a header is over this target
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `droppable-${header.id}`,
  });

  const style: CSSProperties = {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    opacity: isDragging ? 0.95 : 1,
    transition: 'none', // Prevent any transitions for snappy changes
    height: `${HEADER_HEIGHT}px`, // Set fixed header height
  };

  return (
    <th
      ref={draggable ? setDropNodeRef : undefined}
      style={style}
      className={cn(
        'group bg-background relative border-r select-none last:border-r-0',
        sortable || resizable
          ? header.column.getIsResizing()
            ? 'bg-primary/10'
            : 'hover:bg-item-hover'
          : '',
        isOverTarget && 'bg-primary/10 border-primary inset border border-r! border-dashed'
      )}
      // onClick toggles sorting if enabled
      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
    >
      <span
        className={cn(
          'flex h-full flex-1 items-center space-x-1.5 overflow-hidden p-2',
          draggable && 'cursor-grab'
        )}
        ref={draggable ? setDragNodeRef : undefined}
        {...attributes}
        {...listeners}
      >
        <div className="text-text-secondary truncate text-base">
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>

        {sortable && (
          <>
            {header.column.getIsSorted() === 'asc' && (
              <span className="text-icon-color text-[9px]">
                <CaretUp />
              </span>
            )}
            {header.column.getIsSorted() === 'desc' && (
              <span className="text-icon-color text-[9px]">
                <CaretDown />
              </span>
            )}
          </>
        )}
      </span>
      {resizable && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <span
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={cn(
              'group-hover:bg-border hover:bg-primary absolute inset-y-0 -right-0.5 z-10 w-1 cursor-col-resize transition-colors duration-100 select-none',
              header.column.getIsResizing() && 'bg-primary'
            )}
          />
        </span>
      )}
    </th>
  );
};

DraggableHeader.displayName = 'DraggableHeader';

interface DataGridHeaderProps {
  table: Table<Record<string, string | number | Date | null>>;
  sortable: boolean;
  resizable: boolean;
  draggable: boolean;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
}

const HEADER_DROP_TARGET_ID = 'buster-base-header-container';

export const DataGridHeader: React.FC<DataGridHeaderProps> = ({
  rowVirtualizer,
  table,
  sortable,
  resizable,
  draggable,
}) => {
  const overTargetId = useSortColumnContext((x) => x.overTargetId);

  const showScrollShadow = (rowVirtualizer?.scrollOffset || 0) > 10;

  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: HEADER_DROP_TARGET_ID,
  });
  const isOverHeaderDropTarget = overTargetId === HEADER_DROP_TARGET_ID;

  return (
    <thead className="bg-background sticky top-0 z-10 w-full" suppressHydrationWarning>
      <tr
        ref={setDropNodeRef}
        className={cn(
          'data-grid-header flex border-b transition-all duration-200',
          showScrollShadow && 'shadow-sm',
          isOverHeaderDropTarget && 'bg-primary/10'
        )}
      >
        {table
          .getHeaderGroups()[0]
          ?.headers.map(
            (header: Header<Record<string, string | number | Date | null>, unknown>) => (
              <DraggableHeader
                key={header.id}
                header={header}
                sortable={sortable}
                draggable={draggable}
                resizable={resizable}
                isOverTarget={overTargetId === header.id}
              />
            )
          )}
      </tr>
    </thead>
  );
};

DataGridHeader.displayName = 'DataGridHeader';
