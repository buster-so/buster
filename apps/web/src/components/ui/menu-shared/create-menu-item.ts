import type { RegisteredRouter } from '@tanstack/react-router';
import type { MenuDivider, MenuItem, MenuItems } from './menu-items.types';

/**
 * Creates a menu typesafe item object for use in unified menus (dropdown and context).
 * Mostly used for link safety and type inference.
 * @param item - The menu item to create.
 * @returns The menu item.
 */
export function createMenuItem<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(item: MenuItem<T, TRouter, TOptions, TFrom>): MenuItem<T, TRouter, TOptions, TFrom> {
  return item;
}

/**
 * Creates a divider item for separating menu sections.
 * @returns The menu divider object.
 */
export function createMenuDivider(): MenuDivider {
  return {
    type: 'divider',
  };
}

/**
 * Creates a typesafe array of menu items.
 * @param items - The menu items array.
 * @returns The menu items array.
 */
export function createMenuItems<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(items: MenuItems<T, TRouter, TOptions, TFrom>): MenuItems<T, TRouter, TOptions, TFrom> {
  return items;
}
