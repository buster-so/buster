import type { RegisteredRouter } from '@tanstack/react-router';
import type { ILinkProps } from '@/types/routes';
import type { DropdownProps } from './Dropdown';

export type IDropdownItem<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = {
  label: React.ReactNode | string;
  truncate?: boolean;
  searchLabel?: string; // Used for filtering
  secondaryLabel?: string;
  value: T;
  shortcut?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => void;
  closeOnSelect?: boolean; //default is true
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: IDropdownItems<T>;
  link?: string | ILinkProps<TRouter, TOptions, TFrom>;
  linkTarget?: '_blank' | '_self';
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right' | 'none';
  selectType?: DropdownProps<T>['selectType'];
  className?: string;
  onSearch?: (search: string) => void;
};

export interface DropdownDivider {
  type: 'divider';
}

export type IDropdownItems<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = (IDropdownItem<T, TRouter, TOptions, TFrom> | DropdownDivider | React.ReactNode)[];
