import type { Row } from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';
import type React from 'react';
import { cn } from '@/lib/classMerge';
import { DataGridCell } from './DataGridCell';

interface DataGridRowProps {
  row: Row<Record<string, string | number | Date | null>>;
  virtualRow: VirtualItem;
}

export const DataGridRow: React.FC<DataGridRowProps> = ({ row, virtualRow }) => {
  return (
    <tr
      className={cn(
        'hover:bg-item-hover absolute inset-x-0 border-b flex',
        row.getIsSelected() && 'bg-primary/10'
        //   'last:border-b-0' //don't do it
      )}
      style={{
        transform: `translateY(${virtualRow.start}px)`,
        height: `${virtualRow.size}px`,
        width: '100%',
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <DataGridCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
};

DataGridRow.displayName = 'DataGridRow';
