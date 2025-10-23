import { Link } from '@tanstack/react-router';
import get from 'lodash/get';
import React from 'react';
import { cn } from '@/lib/classMerge';
import type { ILinkProps } from '@/types/routes';
import { CheckboxColumn } from './CheckboxColumn';
import { HEIGHT_OF_ROW } from './config';
import type { BusterListColumn, BusterListProps, BusterListRowItem } from './interfaces';

type BusterLilstRowComponentProps<T = unknown> = BusterListRowItem<T> &
  Pick<
    BusterListProps<T>,
    'rowClassName' | 'hideLastRowBorder' | 'columns' | 'useRowClickSelectChange'
  > & {
    onSelectRowChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
    onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
    checked: boolean;
    isLastChild: boolean;
  };

const BusterListRowComponentBase = <T = unknown>({
  link,
  data,
  dataTestId,
  rowClassName,
  hideLastRowBorder,
  onSelectRowChange,
  onClick,
  onContextMenuClick,
  id,
  checked,
  useRowClickSelectChange,
  isLastChild,
  columns,
}: BusterLilstRowComponentProps<T>) => {
  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    onContextMenuClick?.(e, id);
  };

  const onChange = (newChecked: boolean, e: React.MouseEvent) => {
    onSelectRowChange?.(newChecked, id, e);
  };

  const onContainerClick = (e: React.MouseEvent) => {
    if (useRowClickSelectChange) {
      onChange(!checked, e);
    }
    onClick?.();
  };

  return (
    <LinkWrapper link={link}>
      <div
        onClick={onContainerClick}
        onContextMenu={onContextMenu}
        data-testid={dataTestId}
        className={cn(
          'group border-border flex items-center border-b pr-6 h-full',
          isLastChild && hideLastRowBorder ? 'border-b-0!' : '',
          !onSelectRowChange ? 'pl-3.5' : '',
          link || onClick || (onSelectRowChange && useRowClickSelectChange)
            ? 'hover:bg-item-hover cursor-pointer'
            : '',
          rowClassName
        )}
      >
        {onSelectRowChange ? (
          <CheckboxColumn checkStatus={checked ? 'checked' : 'unchecked'} onChange={onChange} />
        ) : null}
        {columns.map((column, columnIndex) => (
          <BusterListCellComponent<T>
            key={String(column.dataIndex)}
            dataItem={get(data, column.dataIndex)}
            row={data as T}
            render={column.render}
            isFirstCell={columnIndex === 0}
            width={column.width}
          />
        ))}
      </div>
    </LinkWrapper>
  );
};

export const BusterListRowComponent = React.memo(BusterListRowComponentBase) as (<T>(
  props: BusterLilstRowComponentProps<T>
) => React.ReactElement | null) & { displayName?: string };

const BusterListCellComponent = <T,>({
  dataItem,
  width,
  row,
  render,
  isFirstCell,
}: {
  isFirstCell: boolean;
  width: number | undefined;
  render: BusterListColumn<T>['render'];
  dataItem: T[keyof T];
  row: T;
}) => {
  return (
    <div
      className={cn(
        'row-cell flex h-full items-center overflow-hidden px-0',
        isFirstCell ? 'text-text-default text-base' : 'text-text-tertiary text-sm'
      )}
      style={{
        width: width || '100%',
        flex: width ? 'none' : 1,
      }}
    >
      <div className="leading-1.3 w-full truncate">
        {render ? render(dataItem, row) : String(dataItem)}
      </div>
    </div>
  );
};

const LinkWrapper: React.FC<{
  link?: ILinkProps;
  children: React.ReactNode;
}> = ({ link, children }) => {
  if (!link) return <>{children}</>;
  return (
    <Link
      {...link}
      preload={link.preload ?? false}
      preloadDelay={link.preloadDelay ?? 50}
      activeOptions={link.activeOptions}
    >
      {children}
    </Link>
  );
};
