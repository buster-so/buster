import type { RegisteredRouter } from '@tanstack/react-router';
import type { ILinkProps } from '@/types/routes';

/**
 * Shared menu item type used by both Dropdown and ContextMenu components
 * This ensures type consistency across both menu systems
 */
export interface MenuItem<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  type?: 'item';
  label: React.ReactNode | string;
  truncate?: boolean;
  searchLabel?: string; // Used for filtering
  secondaryLabel?: string;
  value: T;
  shortcut?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => void;
  closeOnSelect?: boolean; // default is true
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: MenuItems<T>;
  link?: string | ILinkProps<TRouter, TOptions, TFrom>;
  linkTarget?: '_blank' | '_self';
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right' | 'none';
  selectType?: 'single' | 'multiple' | 'none' | 'single-selectable-link';
  emptyStateText?: string | React.ReactNode;
  className?: string;
  menuHeader?: string | React.ReactNode; // if string it will render a search box
  onSearch?: (search: string) => void;
  onScrollToBottom?: () => void;
  isFetchingNextPage?: boolean;
  footerContent?: React.ReactNode;
  footerClassName?: string;
  showIndex?: boolean;
}

/**
 * Divider item type for both menu systems
 */
export interface MenuDivider {
  type: 'divider';
}

/**
 * Array of menu items that can include dividers and React nodes
 */
export type MenuItems<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = (MenuItem<T, TRouter, TOptions, TFrom> | MenuDivider | React.ReactNode)[];
