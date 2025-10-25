import type { RegisteredRouter } from '@tanstack/react-router';
import type React from 'react';
import type { ILinkProps } from '@/types/routes';

// Base properties shared by all sidebar items
type ISidebarItemBase = {
  label: string;
  icon?: React.ReactNode;
  id: string;
  disabled?: boolean;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  collapsedTooltip?: string;
};

// Discriminated union: either has a route (with optional activeOptions) or no route at all
export type ISidebarItem<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = ISidebarItemBase & {
  link?: ILinkProps<TRouter, TOptions, TFrom>;
};

export interface ISidebarGroup<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  label: string;
  icon?: React.ReactNode;
  id: string;
  items: ISidebarItem<TRouter, TOptions, TFrom>[];
  variant?: 'collapsible' | 'icon'; //default is collapsible
  defaultOpen?: boolean; //will default to true
  isSortable?: boolean;
  onItemsReorder?: (ids: string[]) => void;
  triggerClassName?: string;
  className?: string;
  link?: ILinkProps<TRouter, TOptions, TFrom>;
}

export interface ISidebarList<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  items: ISidebarItem<TRouter, TOptions, TFrom>[];
  id: string;
}

export interface SidebarProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  header: React.ReactNode;
  content: ISidebarGroup<TRouter, TOptions, TFrom>[] | ISidebarList<TRouter, TOptions, TFrom>[];
  footer?: React.ReactNode;
  isSortable?: boolean;
  useCollapsible?: boolean;
  onCollapseClick?: (value: boolean) => void;
}
