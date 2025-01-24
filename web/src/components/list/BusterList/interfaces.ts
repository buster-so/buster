import { MenuProps } from 'antd';
import type { MenuDividerType } from 'antd/es/menu/interface';
import type {
  MenuItemType as RcMenuItemType,
  SubMenuType as RcSubMenuType
} from 'rc-menu/lib/interface';

import React from 'react';
export interface BusterListProps {
  columns: BusterListColumn[];
  columnRowVariant?: 'default' | 'containerized';
  rows: BusterListRow[];
  onSelectChange?: (selectedRowKeys: string[]) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: string[];
  contextMenu?: BusterListContextMenu;
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
  render?: (value: any, record: any) => React.JSX.Element | string | React.ReactNode;
  headerRender?: (title: string) => React.ReactNode;
  ellipsis?: boolean;
}

export type BusterListRow = BusterListRowItem;
export interface BusterListRowItem {
  id: string;
  data: Record<string, string | React.ReactNode | any> | null;
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

//CONTEXT MENU INTERFACES
export interface BusterListContextMenu extends Omit<MenuProps, 'items'> {
  items: BusterListMenuItemType[];
}

export interface BusterMenuItemType extends Omit<RcMenuItemType, 'onSelect' | 'onClick'> {
  danger?: boolean;
  icon?: React.ReactNode;
  title?: string;
  onClick?: (id: string) => void;
  key: string;
}
export interface SubMenuType<T extends BusterMenuItemType = BusterMenuItemType>
  extends Omit<RcSubMenuType, 'children' | 'onClick'> {
  icon?: React.ReactNode;
  theme?: 'dark' | 'light';
  children: BusterListMenuItemType<T>[];
}
export type BusterListMenuItemType<T extends BusterMenuItemType = BusterMenuItemType> =
  | T
  | SubMenuType<T>
  | MenuDividerType
  | null;
