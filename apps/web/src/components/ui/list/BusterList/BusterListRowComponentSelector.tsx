import React from 'react';
import { BusterListRowComponent } from './BusterListRowComponent';
import { BusterListSectionComponent } from './BusterListSectionComponent';
import type { BusterListColumn, BusterListProps, BusterListRowItem } from './interfaces';

interface BusterListRowComponentSelectorProps<T = unknown> {
  row: BusterListRowItem<T>;
  columns: BusterListColumn<T>[];
  id: string;
  onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
  onSelectSectionChange?: (v: boolean, id: string) => void;
  onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  selectedRowKeys?: string[];
  rows: BusterListRowItem[];
  style?: React.CSSProperties;
  hideLastRowBorder: NonNullable<BusterListProps['hideLastRowBorder']>;
  rowClassName?: string;
  isLastChild: boolean;
  useRowClickSelectChange?: boolean;
}

const BusterListRowComponentSelectorInner = React.forwardRef(
  <T,>(
    {
      style,
      row,
      rows,
      columns,
      isLastChild,
      onSelectChange,
      onSelectSectionChange,
      selectedRowKeys,
      onContextMenuClick,
      hideLastRowBorder,
      rowClassName,
      useRowClickSelectChange = false
    }: BusterListRowComponentSelectorProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    if (row.hidden) return null;

    if (row.rowSection) {
      return (
        <BusterListSectionComponent
          style={style}
          rowSection={row.rowSection}
          ref={ref}
          id={row.id}
          key={row.id}
          rows={rows}
          selectedRowKeys={selectedRowKeys}
          rowClassName={rowClassName}
          onSelectSectionChange={onSelectSectionChange}
        />
      );
    }

    return (
      <BusterListRowComponent
        style={style}
        row={row}
        columns={columns}
        key={row.id}
        rowClassName={rowClassName}
        onSelectChange={onSelectChange}
        checked={!!selectedRowKeys?.includes(row.id)}
        ref={ref}
        onContextMenuClick={onContextMenuClick}
        hideLastRowBorder={hideLastRowBorder}
        useRowClickSelectChange={useRowClickSelectChange}
        isLastChild={isLastChild}
      />
    );
  }
);

BusterListRowComponentSelectorInner.displayName = 'BusterListRowComponentSelectorInner';

// Type assertion through unknown is safer than any
export const BusterListRowComponentSelector = BusterListRowComponentSelectorInner as (<T>(
  props: BusterListRowComponentSelectorProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null) & { displayName?: string };

BusterListRowComponentSelector.displayName = 'BusterListRowComponentSelector';
