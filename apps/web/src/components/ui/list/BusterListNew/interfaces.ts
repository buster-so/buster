import type { RegisteredRouter } from '@tanstack/react-router';
import type React from 'react';
import type { ILinkProps } from '@/types/routes';
import type { ContextMenuProps } from '../../context-menu/ContextMenu';

export interface BusterListProps<T = unknown> {
  columns: BusterListColumn<T>[];
  hideLastRowBorder?: boolean;
  rows: BusterListRowItems<T>;
  onSelectChange?: (selectedRowKeys: Set<string>) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: Set<string>;
  contextMenu?: ContextMenuProps;
  showSelectAll?: boolean;
  rowClassName?: string;
  className?: string;
  infiniteScrollConfig?: InfiniteScrollConfig;
  useRowClickSelectChange?: boolean;
  scrollParentRef?: React.Ref<HTMLDivElement>;
}

export type BusterListColumn<T = unknown> = {
  [K in keyof T]: {
    dataIndex: K;
    title: string;
    width?: number;
    minWidth?: number;
    align?: 'left' | 'center' | 'right';
    render?: (value: T[K], record: T) => React.JSX.Element | string | React.ReactNode;
    headerRender?: (title: string) => React.ReactNode;
    ellipsis?: boolean;
  };
}[keyof T];

export type BusterListRowItem<
  T = unknown,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  type: 'row';
  id: string;
  data: T | null;
  onClick?: () => void;
  onSelect?: () => void;
  dataTestId?: string;
  //link config
  link?: ILinkProps<TRouter, TOptions, TFrom>;
};

export interface BusterListSectionRow {
  id: string;
  type: 'section';
  title: string;
  secondaryTitle?: string;
  disableSection?: boolean;
}

export type BusterListRow<T = unknown> =
  | BusterListRowItem<T, RegisteredRouter, Record<string, unknown>, string>
  | BusterListSectionRow;

export type BusterListRowItems<T = unknown> = BusterListRow<T>[];

export interface InfiniteScrollConfig {
  onScrollEnd?: () => void;
  scrollEndThreshold?: number;
  //you can just pass a loading spinner component here without any props
  loadingNewContent?: React.ReactNode;
}

export type BusterListImperativeHandle = {
  scrollTo: (id: string) => void;
};
