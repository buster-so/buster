import type { RegisteredRouter } from '@tanstack/react-router';
import type { MenuDivider, MenuItem, MenuItems, UnifiedMenuProps } from '../menu-shared';

/**
 * Context menu item type - type alias for MenuItem
 */
export type ContextMenuItem<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItem<T, TRouter, TOptions, TFrom>;

/**
 * Context menu divider type - type alias for MenuDivider
 */
export type ContextMenuDivider = MenuDivider;

/**
 * Context menu items array type - type alias for MenuItems
 */
export type ContextMenuItems<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> = MenuItems<T, TRouter, TOptions, TFrom>;

/**
 * ContextMenu component props - derived from UnifiedMenuProps
 * This is a thin wrapper around MenuUnified with variant="context"
 */
export interface ContextMenuProps<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> extends Omit<
    UnifiedMenuProps<T, TRouter, TOptions, TFrom>,
    'variant' | 'items' | 'children' | 'align' | 'side' | 'sideOffset'
  > {
  /** Context menu items - type alias for MenuItems for backward compatibility */
  items: ContextMenuItems<T, TRouter, TOptions, TFrom>;
  /** Trigger element */
  children: React.ReactNode;
}
