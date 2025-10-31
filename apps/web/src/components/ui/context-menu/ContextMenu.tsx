import type { RegisteredRouter } from '@tanstack/react-router';
import React from 'react';
import { MenuUnified, type UnifiedMenuProps } from '../menu-shared';
import type { ContextMenuItems, ContextMenuProps } from './contextMenu.types';

/**
 * ContextMenu component - thin wrapper around MenuUnified with variant="context"
 *
 * This component was refactored to use the shared MenuUnified component.
 * All rendering logic is now shared between Dropdown and ContextMenu.
 */
export const ContextMenuBase = <
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  children,
  ...props
}: ContextMenuProps<T, TRouter, TOptions, TFrom>) => {
  return (
    <MenuUnified<T, TRouter, TOptions, TFrom> variant="context" {...props}>
      {children}
    </MenuUnified>
  );
};
ContextMenuBase.displayName = 'ContextMenu';

export const ContextMenu = React.memo(ContextMenuBase) as unknown as typeof ContextMenuBase;
