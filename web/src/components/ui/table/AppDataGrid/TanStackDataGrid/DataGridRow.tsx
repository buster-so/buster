import type React from 'react';
import type { Row } from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';
import { DataGridCell } from './DataGridCell';
import { cn } from '@/lib/classMerge';

interface DataGridRowProps {
  row: Row<Record<string, string | number | Date | null>>;
  virtualRow: VirtualItem;
}

export const DataGridRow: React.FC<DataGridRowProps> = ({ row, virtualRow }) => {
  return (
    <tr
      className={cn(
        'hover:bg-item-hover absolute inset-x-0 flex border-b',
        row.getIsSelected() && 'bg-primary/10'
        //last:border-b-0
      )}
      style={{
        transform: `translateY(${virtualRow.start}px)`,
        height: `${virtualRow.size}px`
      }}>
      {row.getVisibleCells().map((cell) => (
        <DataGridCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
};

DataGridRow.displayName = 'DataGridRow';
