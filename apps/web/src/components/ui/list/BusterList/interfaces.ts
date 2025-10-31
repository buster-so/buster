import type { LinkProps, RegisteredRouter } from '@tanstack/react-router';
import type React from 'react';
import type { ILinkProps } from '@/types/routes';
import type { ContextMenuProps } from '../../context-menu';

export interface BusterListProps<T = unknown> {
  columns: BusterListColumn<T>[];
  hideLastRowBorder?: boolean;
  rows: BusterListRowItem<T>[];
  onSelectChange?: (selectedRowKeys: string[]) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: string[];
  contextMenu?: Omit<ContextMenuProps, 'children'>;
  showSelectAll?: boolean;
  useRowClickSelectChange?: boolean;
  rowClassName?: string;
  className?: string;
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

export type BusterListRowLink<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  link: ILinkProps<TRouter, TOptions, TFrom>;
  preloadDelay?: LinkProps['preloadDelay'];
  preload?: LinkProps['preload'];
};

export type BusterListRowNotLink = {
  link?: never;
};

export type BusterListRowItem<
  T = unknown,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  id: string;
  data: T | null;
  onClick?: () => void;
  onSelect?: () => void;
  rowSection?: BusterListSectionRow;
  hidden?: boolean;
  dataTestId?: string;
} & (BusterListRowLink<TRouter, TOptions, TFrom> | BusterListRowNotLink);

export type BusterListRowItems<T = unknown> = BusterListRowItem<
  T,
  RegisteredRouter,
  Record<string, unknown>,
  string
>[];

export interface BusterListSectionRow {
  title: string;
  secondaryTitle?: string;
  disableSection?: boolean;
}
