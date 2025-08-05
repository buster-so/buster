import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { CheckboxColumn } from './CheckboxColumn';
import { HEIGHT_OF_HEADER } from './config';
import type { BusterListColumn } from './interfaces';

interface BusterListHeaderProps<T> {
  columns: BusterListColumn<T>[];
  onGlobalSelectChange?: (v: boolean) => void;
  globalCheckStatus?: 'checked' | 'unchecked' | 'indeterminate';
  showSelectAll?: boolean;
  rowsLength: number;
  rowClassName: string;
}

export const BusterListHeader = <T = unknown,>({
  columns,
  rowClassName,
  showSelectAll = true,
  onGlobalSelectChange,
  globalCheckStatus,
  rowsLength
}: BusterListHeaderProps<T>) => {
  const showCheckboxColumn = !!onGlobalSelectChange;
  const showGlobalCheckbox =
    globalCheckStatus === 'indeterminate' || globalCheckStatus === 'checked';

  return (
    <div
      className={cn(
        'group border-border flex items-center justify-start border-b pr-6',
        {
          'pl-3.5': !onGlobalSelectChange
        },
        rowClassName
      )}
      style={{
        height: `${HEIGHT_OF_HEADER}px`,
        minHeight: `${HEIGHT_OF_HEADER}px`
      }}>
      {showCheckboxColumn && (
        <CheckboxColumn
          checkStatus={globalCheckStatus}
          onChange={onGlobalSelectChange}
          className={cn({
            'opacity-100': showGlobalCheckbox,
            'invisible!': rowsLength === 0,
            'pointer-events-none invisible!': !showSelectAll
          })}
        />
      )}

      {columns.map((column, index) => (
        <div
          className="header-cell flex h-full items-center p-0"
          key={String(column.dataIndex)}
          style={{
            width: column.width || '100%',
            flex: column.width ? 'none' : 1,
            paddingLeft: showCheckboxColumn ? undefined : '0px'
          }}>
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
