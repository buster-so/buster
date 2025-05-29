import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import get from 'lodash/get';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { CheckboxColumn } from './CheckboxColumn';
import { HEIGHT_OF_ROW } from './config';
import type {
  BusterListColumn,
  BusterListProps,
  BusterListRow,
  BusterListRowItem
} from './interfaces';

export const BusterListRowComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      row: BusterListRow;
      columns: BusterListColumn[];
      checked: boolean;
      onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
      onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
      style?: React.CSSProperties;
      hideLastRowBorder: NonNullable<BusterListProps['hideLastRowBorder']>;
      useRowClickSelectChange: boolean;
      rowClassName?: string;
      isLastChild: boolean;
    }
  >(
    (
      {
        style,
        hideLastRowBorder,
        row,
        columns,
        onSelectChange,
        checked,
        onContextMenuClick,
        rowClassName = '',
        isLastChild,
        useRowClickSelectChange
      },
      ref
    ) => {
      const link = row.link;

      const onContextMenu = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
        onContextMenuClick?.(e, row.id);
      });

      const onChange = useMemoizedFn((newChecked: boolean, e: React.MouseEvent) => {
        onSelectChange?.(newChecked, row.id, e);
      });

      const onContainerClick = useMemoizedFn((e: React.MouseEvent) => {
        if (useRowClickSelectChange) {
          onChange(!checked, e);
        }
        row.onClick?.();
      });

      const rowStyles = {
        height: `${HEIGHT_OF_ROW}px`,
        minHeight: `${HEIGHT_OF_ROW}px`,
        ...style
      };

      return (
        <LinkWrapper href={link}>
          <div
            onClick={onContainerClick}
            style={rowStyles}
            onContextMenu={onContextMenu}
            data-testid={row.dataTestId}
            className={cn(
              'border-border flex items-center border-b pr-6',
              checked ? 'bg-primary-background hover:bg-primary-background-hover' : '',
              isLastChild && hideLastRowBorder ? 'border-b-0!' : '',
              !onSelectChange ? 'pl-3.5' : '',
              link || row.onClick || (onSelectChange && useRowClickSelectChange)
                ? 'hover:bg-item-hover cursor-pointer'
                : '',
              rowClassName,
              'group'
            )}
            ref={ref}>
            {onSelectChange ? (
              <CheckboxColumn checkStatus={checked ? 'checked' : 'unchecked'} onChange={onChange} />
            ) : (
              <></>
            )}
            {columns.map((column, columnIndex) => (
              <BusterListCellComponent
                key={column.dataIndex}
                data={get(row.data, column.dataIndex)}
                row={row}
                render={column.render}
                isFirstCell={columnIndex === 0}
                isLastCell={columnIndex === columns.length - 1}
                width={column.width}
                onSelectChange={onSelectChange}
              />
            ))}
          </div>
        </LinkWrapper>
      );
    }
  )
);
BusterListRowComponent.displayName = 'BusterListRowComponent';

const BusterListCellComponent: React.FC<{
  data: string | number | React.ReactNode;
  row: BusterListRowItem['data'];
  isFirstCell?: boolean;
  isLastCell?: boolean;
  width?: number | undefined;
  onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
  render?: (data: string | number | React.ReactNode, row: BusterListRowItem) => React.ReactNode;
}> = React.memo(({ data, width, row, render, isFirstCell, isLastCell, onSelectChange }) => {
  const memoizedStyle = useMemo(() => {
    return {
      width: width || '100%',
      flex: width ? 'none' : 1
    };
  }, [width, isLastCell, onSelectChange]);

  return (
    <div
      className={cn(
        'row-cell flex h-full items-center overflow-hidden px-0',
        isFirstCell ? 'text-text-default text-base' : 'text-text-tertiary text-sm'
      )}
      style={memoizedStyle}>
      <div className="leading-1.3 w-full truncate">{render ? render(data, row?.data) : data}</div>
    </div>
  );
});
BusterListCellComponent.displayName = 'BusterListCellComponent';

const LinkWrapper: React.FC<{
  href?: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} prefetch={false}>
      {children}
    </Link>
  );
};
