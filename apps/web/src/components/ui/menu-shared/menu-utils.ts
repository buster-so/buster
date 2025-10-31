import type { RegisteredRouter } from '@tanstack/react-router';
import React from 'react';
import type { MenuDivider, MenuItem, MenuItems } from './menu-items.types';

/**
 * Generate a unique key for a menu item
 */
export const menuItemKey = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  item: MenuItems<T, TRouter, TOptions, TFrom>[number],
  index: number
): string => {
  if ((item as MenuDivider).type === 'divider') return `divider-${index}`;
  if ((item as MenuItem<T, TRouter, TOptions, TFrom>).value !== undefined)
    return String((item as MenuItem<T, TRouter, TOptions, TFrom>).value);
  return `item-${index}`;
};

/**
 * Check if an item has a value (is a MenuItem)
 */
export const hasValue = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  item: MenuItems<T, TRouter, TOptions, TFrom>[number]
): item is MenuItem<T, TRouter, TOptions, TFrom> => {
  return (item as MenuItem<T, TRouter, TOptions, TFrom>).value !== undefined;
};

/**
 * Check if an item is a divider
 */
export const isDivider = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  item: MenuItems<T, TRouter, TOptions, TFrom>[number]
): item is MenuDivider => {
  return (item as MenuDivider).type === 'divider';
};

/**
 * Check if an item is a valid React element
 */
export const isReactElement = (item: unknown): item is React.ReactElement => {
  return typeof item === 'object' && item !== null && React.isValidElement(item);
};

/**
 * Filter items to separate selected and unselected (for multiple selection)
 */
export const separateSelectedItems = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  items: MenuItems<T, TRouter, TOptions, TFrom>
): {
  selectedItems: MenuItems<T, TRouter, TOptions, TFrom>;
  unselectedItems: MenuItems<T, TRouter, TOptions, TFrom>;
} => {
  const [selectedItems, unselectedItems] = items.reduce(
    (acc, item) => {
      if ((item as MenuItem<T, TRouter, TOptions, TFrom>).selected) {
        acc[0].push(item);
      } else {
        acc[1].push(item);
      }
      return acc;
    },
    [[], []] as [typeof items, typeof items]
  );
  return { selectedItems, unselectedItems };
};
