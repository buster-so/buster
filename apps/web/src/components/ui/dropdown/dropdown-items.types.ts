import type { RegisteredRouter } from '@tanstack/react-router';
import type { MenuDivider, MenuItem, MenuItems } from '../menu-shared';

export type IDropdownItem<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItem<T, TRouter, TOptions, TFrom>;

export type DropdownDivider = MenuDivider;

export type IDropdownItems<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItems<T, TRouter, TOptions, TFrom>;
