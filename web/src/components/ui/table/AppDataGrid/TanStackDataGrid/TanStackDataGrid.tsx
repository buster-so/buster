'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { defaultCellFormat, defaultHeaderFormat } from './defaultFormat';
import { cn } from '@/lib/classMerge';
import { DataGridHeader } from './DataGridHeader';
import { DataGridRow } from './DataGridRow';
import { CELL_HEIGHT, OVERSCAN } from './constants';
import { SortColumnWrapper } from './SortColumnWrapper';
import { useDebounceFn } from '@/hooks';
import { createDefaultTableColumnWidths } from '@/lib/metrics/messageAutoChartHandler/createDefaultTableColumnWidths';

export interface TanStackDataGridProps {
  className?: string;
  resizable?: boolean;
  sortable?: boolean;
  draggable?: boolean;
  rows: Record<string, string | number | null | Date>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  headerFormat?: (value: string | number | Date | null, columnName: string) => string;
  cellFormat?: (value: string | number | Date | null, columnName: string) => string;
  onReorderColumns?: (columnIds: string[]) => void;
  onReady?: () => void;
  onResizeColumns?: (
    columnSizes: {
      key: string;
      size: number;
    }[]
  ) => void;
}

export const TanStackDataGrid: React.FC<TanStackDataGridProps> = React.memo(
  ({
    className = '',
    resizable = true,
    sortable = true,
    draggable = true,
    columnWidths: columnWidthsProp,
    columnOrder: serverColumnOrder,
    onReorderColumns,
    onResizeColumns,
    onReady,
    rows,
    headerFormat = defaultHeaderFormat,
    cellFormat = defaultCellFormat
  }) => {
    // Get a list of fields (each field becomes a column)
    const fields = useMemo(() => {
      return Object.keys(rows[0] || {});
    }, [rows]);

    // Set up initial states for sorting, column sizing, and column order.
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnSizing, setColumnSizing] = useState(() => {
      return createDefaultTableColumnWidths(
        fields,
        rows,
        columnWidthsProp,
        cellFormat,
        headerFormat
      );
    });
    const [colOrder, setColOrder] = useState<string[]>(serverColumnOrder || fields);
    // Build columns from fields.
    const columns = useMemo<
      ColumnDef<Record<string, string | number | Date | null>, string | number | Date | null>[]
    >(
      () =>
        fields.map((field) => ({
          id: field,
          accessorKey: field,
          header: () => headerFormat(field, field),
          cell: (info) => cellFormat(info.getValue(), field),
          enableSorting: sortable,
          enableResizing: resizable,
          enableDragging: draggable
        })),
      [fields, headerFormat, cellFormat, sortable, resizable, draggable]
    );

    // Create the table instance.
    const table = useReactTable({
      data: rows,
      columns,
      state: {
        sorting,
        columnSizing,
        columnOrder: colOrder
      },
      enableSorting: sortable,
      onSortingChange: setSorting,
      onColumnSizingChange: setColumnSizing,
      onColumnOrderChange: setColOrder,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      columnResizeMode: 'onChange'
    });

    // Set up the virtualizer for infinite scrolling.
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => CELL_HEIGHT, // estimated row height
      overscan: OVERSCAN
    });

    const { run: onResizeColumnsDebounced } = useDebounceFn(onResizeColumns || (() => {}), {
      wait: 450
    });

    // Notify when column sizing changes.
    useEffect(() => {
      if (onResizeColumns) {
        const sizes = Object.entries(columnSizing).map(([key, size]) => ({ key, size }));
        const isDifferent = sizes.some((size) => size.size !== columnWidthsProp?.[size.key]);
        if (isDifferent) {
          onResizeColumnsDebounced(sizes);
        }
      }
    }, [columnSizing, onResizeColumns]);

    useEffect(() => {
      if (columnWidthsProp) {
        setColumnSizing(
          createDefaultTableColumnWidths(fields, rows, columnWidthsProp, cellFormat, headerFormat)
        );
      }
    }, [columnWidthsProp]);

    // Call onReady when the table is first set up.
    useEffect(() => {
      if (onReady) onReady();
    }, [onReady]);

    return (
      <div ref={parentRef} className={cn('h-full w-full overflow-auto', className)}>
        <SortColumnWrapper
          table={table}
          draggable={draggable}
          colOrder={colOrder}
          setColOrder={setColOrder}
          onReorderColumns={onReorderColumns}>
          <table className="bg-background w-full">
            <DataGridHeader
              table={table}
              sortable={sortable}
              draggable={draggable}
              resizable={resizable}
              rowVirtualizer={rowVirtualizer}
            />

            <tbody
              className="relative"
              style={{ display: 'grid', height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];
                return <DataGridRow key={row.id} row={row} virtualRow={virtualRow} />;
              })}
            </tbody>
          </table>
        </SortColumnWrapper>
      </div>
    );
  }
);

TanStackDataGrid.displayName = 'TanStackDataGrid';
