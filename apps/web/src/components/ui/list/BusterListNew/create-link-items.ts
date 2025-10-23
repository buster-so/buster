import type { RegisteredRouter } from '@tanstack/react-router';
import type { BusterListColumn, BusterListRow, BusterListRowItem } from './interfaces';

export function createListItemsWithOptions<
  T,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  items: BusterListRowItem<T, TRouter, TOptions, TFrom>[]
): BusterListRowItem<T, TRouter, TOptions, TFrom>[] {
  return items;
}

// Original function for full type inference
export function createListItemWithOptions<
  T = unknown,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
>(
  item: BusterListRowItem<T, TRouter, TOptions, TFrom>
): BusterListRowItem<T, TRouter, TOptions, TFrom> {
  return item;
}

// Simple solution: function that lets you specify ONLY the data type
export function createListItem<T>() {
  return <
    TRouter extends RegisteredRouter = RegisteredRouter,
    TOptions = Record<string, unknown>,
    TFrom extends string = string,
  >(
    item: BusterListRowItem<T, TRouter, TOptions, TFrom>
  ) => item as unknown as BusterListRowItem<T>;
}

export function createListItems<T>() {
  return <
    TRouter extends RegisteredRouter = RegisteredRouter,
    TOptions = Record<string, unknown>,
    TFrom extends string = string,
  >(
    items: BusterListRowItem<T, TRouter, TOptions, TFrom>[]
  ): BusterListRowItem<T, TRouter, TOptions, TFrom>[] => items;
}
