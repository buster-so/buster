import React from 'react';
import type { BusterListColumn } from './interfaces';
import { CheckboxColumn } from './CheckboxColumn';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { HEIGHT_OF_HEADER } from './config';

export const BusterListHeader: React.FC<{
  columns: BusterListColumn[];
  onGlobalSelectChange?: (v: boolean) => void;
  globalCheckStatus?: 'checked' | 'unchecked' | 'indeterminate';
  showSelectAll?: boolean;
  rowsLength: number;
  rowClassName: string;
}> = React.memo(
  ({
    columns,
    rowClassName,
    showSelectAll = true,
    onGlobalSelectChange,
    globalCheckStatus,
    rowsLength
  }) => {
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
            key={column.dataIndex}
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
  }
);
BusterListHeader.displayName = 'BusterListHeader';
