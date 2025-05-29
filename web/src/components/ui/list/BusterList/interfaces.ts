import type React from 'react';
import type { ContextMenuProps } from '../../context/ContextMenu';
export interface BusterListProps {
  columns: BusterListColumn[];
  hideLastRowBorder?: boolean;
  rows: BusterListRow[];
  onSelectChange?: (selectedRowKeys: string[]) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: string[];
  contextMenu?: ContextMenuProps;
  showSelectAll?: boolean;
  useRowClickSelectChange?: boolean;
  rowClassName?: string;
}

export interface BusterListColumn {
  dataIndex: string;
  title: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right'; //TODO
  render?: (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    value: string | number | boolean | null | undefined | any,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    record: any
  ) => React.JSX.Element | string | React.ReactNode;
  headerRender?: (title: string) => React.ReactNode;
  ellipsis?: boolean;
}

export type BusterListRow = BusterListRowItem;
export interface BusterListRowItem {
  id: string;
  data: Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    string | React.ReactNode | number | boolean | null | undefined | object | any
  > | null;
  onClick?: () => void;
  link?: string;
  onSelect?: () => void;
  rowSection?: BusterListSectionRow;
  hidden?: boolean;
}

export interface BusterListSectionRow {
  title: string;
  secondaryTitle?: string;
  disableSection?: boolean;
}
