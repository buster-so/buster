import { type Cell, flexRender } from '@tanstack/react-table';
import type React from 'react';
import { cn } from '@/lib/classMerge';
import { CELL_HEIGHT } from './constants';

interface DataGridCellProps {
  cell: Cell<Record<string, string | number | Date | null>, unknown>;
}

//DO NOT MEMOIZE CELL
export const DataGridCell: React.FC<DataGridCellProps> = ({ cell }) => {
  return (
    <td
      className={cn(
        'relative flex items-center border-r px-2 last:border-r-0',
        cell.column.getIsResizing() && 'bg-primary/4'
      )}
      style={{
        width: cell.column.getSize(),
        height: CELL_HEIGHT,
      }}
    >
      <div className="truncate text-base">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>

      {cell.column.getIsResizing() && (
        <span className="bg-primary absolute inset-y-0 -right-0.5 z-10 -my-1 h-[105%] w-1" />
      )}
    </td>
  );
};

DataGridCell.displayName = 'DataGridCell';
