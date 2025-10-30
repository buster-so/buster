import type { ContextMenuProps as ContextMenuPropsRadix } from '@radix-ui/react-context-menu';
import type { RegisteredRouter } from '@tanstack/react-router';
import type { MenuDivider, MenuItem, MenuItems } from '../menu-shared';

/**
 * Re-export shared types with legacy names for backward compatibility
 * @deprecated Use MenuItem from menu-shared instead
 */
export type ContextMenuItem<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItem<T, TRouter, TOptions, TFrom>;

/**
 * Re-export shared divider type with legacy name for backward compatibility
 * @deprecated Use MenuDivider from menu-shared instead
 */
export type ContextMenuDivider = MenuDivider;

/**
 * Re-export shared items array type with legacy name for backward compatibility
 * @deprecated Use MenuItems from menu-shared instead
 */
export type ContextMenuItems<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItems<T, TRouter, TOptions, TFrom>;

export interface ContextMenuProps extends ContextMenuPropsRadix {
  items: ContextMenuItems;
  className?: string;
  disabled?: boolean;
}
