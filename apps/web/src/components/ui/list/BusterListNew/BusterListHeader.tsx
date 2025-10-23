import React, { useMemo } from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { CheckboxColumn, type CheckboxStatus } from './CheckboxColumn';
import { HEIGHT_OF_HEADER } from './config';
import type { BusterListColumn } from './interfaces';

interface BusterListHeaderProps<T> {
  columns: BusterListColumn<T>[];
  onGlobalSelectChange: ((v: boolean) => void) | undefined;
  showSelectAll: boolean | undefined;
  rowsLength: number;
  rowClassName: string | undefined;
  selectedRowKeys: Set<string> | undefined;
}

export const BusterListHeader = <T = unknown>({
  columns,
  rowClassName,
  showSelectAll = true,
  onGlobalSelectChange,
  rowsLength,
  selectedRowKeys,
}: BusterListHeaderProps<T>) => {
  const showCheckboxColumn = !!onGlobalSelectChange;

  const globalCheckStatus: CheckboxStatus = useMemo(() => {
    if (!rowsLength || !selectedRowKeys || selectedRowKeys.size === 0) return 'unchecked';
    if (selectedRowKeys.size === rowsLength) return 'checked';
    return 'indeterminate';
  }, [rowsLength, selectedRowKeys]);

  const showGlobalCheckbox =
    globalCheckStatus === 'indeterminate' || globalCheckStatus === 'checked';

  return (
    <div
      className={cn(
        'group border-border flex items-center justify-start border-b pr-6',
        !onGlobalSelectChange && 'pl-3.5',
        rowClassName
      )}
      style={{
        height: `${HEIGHT_OF_HEADER}px`,
      }}
    >
      {showCheckboxColumn && (
        <CheckboxColumn
          checkStatus={globalCheckStatus}
          onChange={onGlobalSelectChange}
          className={cn(
            showSelectAll
              ? 'hover:visible invisible group-hover:visible'
              : 'pointer-events-none invisible!',
            showGlobalCheckbox && 'visible'
          )}
        />
      )}

      {columns.map((column, _index) => (
        <div
          className="header-cell flex h-full items-center p-0"
          key={String(column.dataIndex)}
          style={{
            width: column.width || '100%',
            flex: column.width ? 'none' : 1,
            paddingLeft: showCheckboxColumn ? undefined : '0px',
          }}
        >
          {column.headerRender ? (
            column.headerRender(column.title)
          ) : (
            <Text size="sm" variant="secondary" truncate>
              {column.title}
            </Text>
          )}
        </div>
      ))}
    </div>
  );
};
