'use client';

import DataGrid from 'react-data-grid';
import type {
  Column,
  CopyEvent,
  RenderCellProps,
  RenderHeaderCellProps,
  SortColumn
} from 'react-data-grid';
import isNumber from 'lodash/isNumber';
import isDate from 'lodash/isDate';
import isString from 'lodash/isString';
import { Text } from '@/components/text';
import round from 'lodash/round';
import { ErrorBoundary } from '@/components/error';

//https://www.npmjs.com/package/react-spreadsheet-grid#live-playground
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createStyles } from 'antd-style';
import {
  useDebounce,
  useDebounceEffect,
  useDebounceFn,
  useMemoizedFn,
  useMount,
  useSize
} from 'ahooks';
import sampleSize from 'lodash/sampleSize';
import { AppMaterialIcons } from '../../icons';
import isEmpty from 'lodash/isEmpty';
import {
  createInitialColumnWidths,
  defaultCellFormat,
  defaultHeaderFormat,
  MIN_WIDTH
} from './helpers';

type Row = Record<string, string | number | null | Date>;

const DEFAULT_COLUMN_WIDTH = {
  width: '1fr',
  minWidth: MIN_WIDTH
  //  maxWidth: columnsOrder.length <= 2 ? undefined : MAX_WIDTH
};

export interface AppDataGridProps {
  initialWidth?: number;
  animate?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  sortable?: boolean;
  rows: Record<string, string | number | null | Date>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  headerFormat?: (value: any, columnName: string) => string;
  cellFormat?: (value: any, columnName: string) => string;
  onReorderColumns?: (columns: string[]) => void;
  onReady?: () => void;
  onResizeColumns?: (
    columnSizes: {
      key: string;
      size: number;
    }[]
  ) => void;
}

export const AppDataGrid: React.FC<AppDataGridProps> = React.memo(
  ({
    resizable = true,
    draggable = true,
    sortable = true,
    animate = true,
    columnWidths: columnWidthsProp,
    columnOrder: serverColumnOrder,
    onReorderColumns,
    onResizeColumns,
    onReady,
    rows,
    headerFormat = defaultHeaderFormat,
    cellFormat = defaultCellFormat,
    initialWidth
  }) => {
    const [forceRenderId, setForceRenderId] = useState(1);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

    const hasErroredOnce = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { styles, cx } = useStyles();

    const widthOfContainer = useDebounce(useSize(containerRef)?.width ?? initialWidth, {
      wait: 20,
      maxWait: 500,
      leading: true
    });

    const sampleOfRows = useMemo(() => sampleSize(rows, 15), [rows]);
    const fields = useMemo(() => {
      const newFields = Object.keys(rows[0] || {});
      return newFields;
    }, [rows]);

    const onCreateInitialColumnWidths = useMemoizedFn(() => {
      const res = createInitialColumnWidths(
        fields,
        sampleOfRows,
        headerFormat,
        cellFormat,
        columnWidthsProp,
        widthOfContainer,
        serverColumnOrder
      );
      return res;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
      onCreateInitialColumnWidths()
    );
    const canRenderGrid = rows.length > 0 && !isEmpty(columnWidths);

    const memoizedRenderHeaderCell = useMemoizedFn((v: RenderHeaderCellProps<Row, unknown>) => (
      <HeaderCell {...v} headerFormat={headerFormat} />
    ));

    const memoizedRenderCell = useMemoizedFn((v: RenderCellProps<Row, unknown>) => (
      <GridCell {...v} cellFormat={cellFormat} />
    ));

    const columnsBase: Column<Row>[] = useMemo(() => {
      if (!canRenderGrid) return [];
      return fields.map((key) => ({
        key,
        name: key,
        resizable,
        sortable,
        draggable,
        renderHeaderCell: memoizedRenderHeaderCell,
        renderCell: memoizedRenderCell
      }));
      //header and cell format are needed for the grid to render
    }, [draggable, fields, resizable, cellFormat, headerFormat]);

    const columns = useMemo(() => {
      return columnsBase.map((column) => ({
        ...column,
        width: columnWidths[column.key]
      }));
    }, [columnsBase, columnWidths]);

    const [columnsOrder, setColumnsOrder] = useState((): number[] =>
      columns.map((_, index) => index)
    );

    const reorderedColumns = useMemo(
      () => columnsOrder.map((index) => columns[index]).filter(Boolean), //for the love of all things holy don't remove this filter. It is need to prevent everything from blowing up 💥🔥💣⚡🌪️💨💀🎇🌋🌀
      [columns, columnsOrder]
    );

    const sortedRows = useMemo((): Row[] => {
      if (sortColumns.length === 0) return rows;
      const { columnKey, direction } = sortColumns[0];
      let sortedRows: Row[] = [...rows];

      if (isNumber(rows[0][columnKey])) {
        sortedRows = sortedRows.sort((a, b) => (a[columnKey] as number) - (b[columnKey] as number));
      } else if (isDate(rows[0][columnKey])) {
        sortedRows = sortedRows.sort(
          (a, b) => (a[columnKey] as Date).getTime() - (b[columnKey] as Date).getTime()
        );
      } else if (isString(rows[0][columnKey])) {
        sortedRows = sortedRows.sort((a, b) =>
          String(a[columnKey]).localeCompare(String(b[columnKey]))
        );
      }

      return direction === 'DESC' ? sortedRows.reverse() : sortedRows;
    }, [rows, sortColumns]);

    const onSortColumnsChange = useMemoizedFn((sortColumns: SortColumn[]) => {
      setSortColumns(sortColumns.slice(-1));
    });

    const onColumnsReorder = useMemoizedFn((sourceKey: string, targetKey: string) => {
      setColumnsOrder((columnsOrder) => {
        const sourceColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === sourceKey
        );
        const targetColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === targetKey
        );
        const sourceColumnOrder = columnsOrder[sourceColumnOrderIndex];
        const newColumnsOrder = columnsOrder.toSpliced(sourceColumnOrderIndex, 1);
        newColumnsOrder.splice(targetColumnOrderIndex, 0, sourceColumnOrder);
        onReorderColumns?.(newColumnsOrder.map((index) => columns[index].key));
        return newColumnsOrder;
      });
    });

    const handleCopy = useMemoizedFn(({ sourceRow, sourceColumnKey }: CopyEvent<Row>): void => {
      if (window.isSecureContext) {
        if (sourceRow[sourceColumnKey as keyof Row] === null) return;
        const stringifiedValue = String(sourceRow[sourceColumnKey as keyof Row]);
        navigator.clipboard.writeText(stringifiedValue);
      }
    });

    const onColumnResize = useMemoizedFn((index: number, size: number) => {
      const newSizes = columns.reduce<Record<string, number>>((acc, column, i) => {
        if (!column.key) return acc;

        acc[column.key] = i === index ? round(size) : (column.width as number);
        return acc;
      }, {});
      const columnArray = columns
        .map((column) => ({
          key: column.key,
          size: newSizes[column.key]
        }))
        .sort(
          (a, b) =>
            columnsOrder.indexOf(columns.findIndex((c) => c.key === a.key)) -
            columnsOrder.indexOf(columns.findIndex((c) => c.key === b.key))
        );

      onResizeColumnsDebounce(columnArray);
      onColumnResizeDebounce();
    });

    const { run: onResizeColumnsDebounce } = useDebounceFn(
      (columnArray: { key: string; size: number }[]) => {
        onResizeColumns?.(columnArray);
      },
      { wait: 300 }
    );

    const onColumnResizeOverflowCheck = useMemoizedFn(() => {
      if (widthOfContainer) {
        const gridElement = containerRef.current
          ?.querySelector('.rdg-header-row')
          ?.querySelectorAll('.rdg-cell');
        let widthOfGrid = 0;
        gridElement?.forEach((element) => {
          widthOfGrid += element?.clientWidth || 0;
        });

        if (gridElement && widthOfGrid && widthOfGrid < widthOfContainer) {
          const actualWidths = reorderedColumns.reduce<Record<string, number>>((acc, column, i) => {
            if (!column.key) return acc;
            acc[column.key] = gridElement[i]?.clientWidth || 0;
            return acc;
          }, {});

          const newSizes = { ...actualWidths };
          const lastColumn = reorderedColumns[reorderedColumns.length - 1];
          if (lastColumn?.key) {
            const lastElementWidth = gridElement[reorderedColumns.length - 1]?.clientWidth || 0;
            newSizes[lastColumn.key] = widthOfContainer - widthOfGrid + lastElementWidth;
          }
          const hasSignificantChanges = Object.entries(newSizes).some(([key, newSize]) => {
            const currentSize = columnWidths[key];
            return !currentSize || Math.abs(newSize - currentSize) > 2;
          });

          const actualWidthTotal = Object.values(actualWidths).reduce(
            (sum, width) => sum + width,
            0
          );
          const isActualWidthLessThanGrid = Math.abs(actualWidthTotal - widthOfContainer) >= 3;

          if (!hasSignificantChanges && !isActualWidthLessThanGrid) {
            return;
          }

          setForceRenderId((prev) => prev + 1);

          setColumnWidths(() => {
            return newSizes;
          });

          const newColumnArray = columns
            .map((column) => ({
              key: column.key,
              size: newSizes[column.key]
            }))
            .sort(
              (a, b) =>
                columnsOrder.indexOf(columns.findIndex((c) => c.key === a.key)) -
                columnsOrder.indexOf(columns.findIndex((c) => c.key === b.key))
            );
          onResizeColumnsDebounce?.(newColumnArray);

          return;
        }
      }
    });

    const { run: onColumnResizeDebounce } = useDebounceFn(onColumnResizeOverflowCheck, {
      wait: 350
    });

    const handleErrorBoundary = useMemoizedFn(() => {
      if (!hasErroredOnce.current) {
        setForceRenderId((prev) => prev + 1);
        hasErroredOnce.current = true;
      }
    });

    useLayoutEffect(() => {
      if (rows.length === 0 || fields.length === 0) return;

      // Reset columns order and widths when fields change
      if (widthOfContainer) {
        const initialColumnWidths = onCreateInitialColumnWidths();
        const isDifferentInitialColumnWidths =
          JSON.stringify(initialColumnWidths) !== JSON.stringify(columnWidths);
        if (isDifferentInitialColumnWidths) setColumnWidths(initialColumnWidths);
        const newColumnsOrder = columns.map((_, index) => index);
        const isDifferentColumnsOrder =
          JSON.stringify(newColumnsOrder) !== JSON.stringify(columnsOrder);
        if (isDifferentColumnsOrder) setColumnsOrder(newColumnsOrder);
      }
    }, [rows, fields]);

    useDebounceEffect(
      () => {
        onColumnResizeOverflowCheck();
      },
      [widthOfContainer],
      { wait: 100 }
    );

    useMount(() => {
      requestAnimationFrame(() => {
        onReady?.();
        onColumnResizeOverflowCheck();
      });
    });

    return (
      <React.Fragment key={forceRenderId}>
        <ErrorBoundary onError={handleErrorBoundary}>
          <div
            ref={containerRef}
            className={cx('flex h-full w-full', styles.dataGridContainer)}
            style={{
              transition: animate ? 'opacity 0.25s' : undefined
            }}>
            <DataGrid
              className={cx(styles.dataGrid)}
              columns={reorderedColumns}
              rows={sortedRows}
              sortColumns={sortColumns}
              onSortColumnsChange={onSortColumnsChange}
              headerRowHeight={36}
              rowHeight={36}
              enableVirtualization={rows.length > 60}
              onCopy={handleCopy}
              onColumnResize={onColumnResize}
              onColumnsReorder={onColumnsReorder}
              defaultColumnOptions={DEFAULT_COLUMN_WIDTH}
              direction={'ltr'}
            />
            <div style={{ width: '100%' }}></div>
          </div>
        </ErrorBoundary>
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => {
    const keysToCheck: (keyof AppDataGridProps)[] = [
      'cellFormat',
      'headerFormat',
      'columnOrder',
      'resizable',
      'draggable',
      'rows'
    ];
    return keysToCheck.every((key) => prevProps[key] === nextProps[key]);
  }
);
AppDataGrid.displayName = 'AppDataGrid';

const HeaderCell: React.FC<
  RenderHeaderCellProps<Row, unknown> & {
    headerFormat: (value: any, columnName: string) => string;
  }
> = React.memo(({ column, headerFormat, sortDirection, ...rest }) => {
  const { name, sortable, key } = column;
  return (
    <div className="flex items-center overflow-hidden">
      <Text className="!block" ellipsis>
        {headerFormat(name, key)}
      </Text>
      {sortable && sortDirection && (
        <AppMaterialIcons
          size={19}
          className="transition"
          style={{
            transform: `rotate(${sortDirection === 'ASC' ? 0 : 180}deg)`
          }}
          icon="arrow_drop_down"
        />
      )}
    </div>
  );
});
HeaderCell.displayName = 'HeaderCell';

const GridCell: React.FC<
  RenderCellProps<Row, unknown> & {
    cellFormat: (value: any, columnName: string) => string;
  }
> = React.memo(({ row, column, cellFormat }) => {
  let value = row[column.key];
  if (typeof value === 'object' && value !== null) {
    value = JSON.stringify(value);
  }
  return cellFormat(value, column.key);
});
GridCell.displayName = 'GridCell';

export default AppDataGrid;

const useStyles = createStyles(({ css, token }) => {
  return {
    dataGridContainer: css`
      display: flex;
      flex-direction: column;
      background: ${token.colorBgBase};
    `,
    dataGrid: css`
      block-size: 100%;
      // border-width: revert-layer;
      // border-style: revert-layer;
      // border-color: ${token.colorBorder};

      .rdg-header-row {
        .rdg-cell {
          font-weight: ${token.fontWeightStrong};
          overflow: hidden;
          border-width: 0.5px;

          .rdg-header-sort-name {
            overflow: hidden;
            text-overflow: ellipsis;
            display: block !important;
          }

          span:nth-child(1) {
            display: flex;
            align-items: center;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          &:last-child {
            border-right: 0px solid;
          }
        }
      }

      .rdg-row {
        .rdg-cell {
          border-bottom: 0px solid;
          white-space: break-spaces;
          word-wrap: break-word;
          overflow-y: auto;
          border-width: 0.5px;
          border-bottom: 0px solid;

          &:last-child {
            border-right: 0px solid;
          }
        }

        &:has(+ div.rdg-row) {
          .rdg-cell {
            border-bottom: 0.5px solid ${token.colorBorder} !important;
          }
        }
      }

      .rdg-cell-copied {
        background-color: ${token.colorPrimaryBgHover};
      }

      * {
        border-width: revert-layer;
        border-style: revert-layer;
        border-color: ${token.colorBorder};
      }

      --rdg-color: ${token.colorTextBase};
      --rdg-border-color: ${token.colorBorder};
      --rdg-header-background-color: ${token.colorBgBase};
      --rdg-selection-color: ${token.colorPrimary};
      --rdg-checkbox-focus-color: ${token.colorPrimaryHover};
      --rdg-font-size: ${token.fontSize}px;
      --rdg-row-selected-background-color: ${token.colorPrimaryBg};
      --rdg-row-selected-hover-background-color: ${token.colorPrimaryBgHover};
      --rdg-row-hover-background-color: ${token.controlItemBgHover};
      --rdg-header-draggable-background-color: ${token.colorPrimaryBgHover};
      --rdg-background-color: ${token.colorBgBase};
    `
  };
});
