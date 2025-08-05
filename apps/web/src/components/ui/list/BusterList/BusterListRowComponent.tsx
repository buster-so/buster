import get from 'lodash/get';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { CheckboxColumn } from './CheckboxColumn';
import { HEIGHT_OF_ROW } from './config';
import type { BusterListColumn, BusterListProps, BusterListRowItem } from './interfaces';

interface BusterListRowComponentProps<T> {
  row: BusterListRowItem<T>;
  columns: BusterListColumn<T>[];
  checked: boolean;
  onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
  onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  style?: React.CSSProperties;
  hideLastRowBorder: NonNullable<BusterListProps['hideLastRowBorder']>;
  useRowClickSelectChange: boolean;
  rowClassName?: string;
  isLastChild: boolean;
}

const BusterListRowComponentInner = React.forwardRef(
  <T,>(
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
    }: BusterListRowComponentProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
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
          ) : null}
          {columns.map((column, columnIndex) => (
            <BusterListCellComponent<T>
              key={String(column.dataIndex)}
              dataItem={get(row.data, column.dataIndex)}
              row={row.data as T}
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
);

BusterListRowComponentInner.displayName = 'BusterListRowComponentInner';

// Type assertion through unknown is safer than any
export const BusterListRowComponent = BusterListRowComponentInner as (<T>(
  props: BusterListRowComponentProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null) & { displayName?: string };

BusterListRowComponent.displayName = 'BusterListRowComponent';

interface BusterListCellComponentProps<T> {
  dataItem: T[keyof T];
  row: T;
  isFirstCell?: boolean;
  isLastCell?: boolean;
  width?: number | undefined;
  onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
  render?: BusterListColumn<T>['render'];
}

const BusterListCellComponent = <T,>({
  dataItem,
  width,
  row,
  render,
  isFirstCell,
  isLastCell,
  onSelectChange
}: BusterListCellComponentProps<T>) => {
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
      <div className="leading-1.3 w-full truncate">
        {render ? render(dataItem, row) : String(dataItem)}
      </div>
    </div>
  );
};

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
