import type { RegisteredRouter } from '@tanstack/react-router';
import type { DropdownDivider, IDropdownItem, IDropdownItems } from './dropdown-items.types';

/**
 * Creates a dropdown typesafe item object for use in dropdown menus. Mostly used for link safety
 * @param item - The dropdown item to create.
 * @returns The dropdown item.
 */
export function createDropdownItem<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(item: IDropdownItem<T, TRouter, TOptions, TFrom>): IDropdownItem<T, TRouter, TOptions, TFrom> {
  return item;
}

/**
 * Creates a divider item for separating dropdown menu sections.
 * @returns The dropdown divider object.
 */
export function createDropdownDivider(): DropdownDivider {
  return {
    type: 'divider',
  };
}

export function createDropdownItems<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(items: IDropdownItems<T, TRouter, TOptions, TFrom>): IDropdownItems<T, TRouter, TOptions, TFrom> {
  return items;
}
