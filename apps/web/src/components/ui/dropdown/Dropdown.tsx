import type { RegisteredRouter } from '@tanstack/react-router';
import React from 'react';
import { MenuUnified, type UnifiedMenuProps } from '../menu-shared';
import type { IDropdownItems } from './dropdown-items.types';

/**
 * Dropdown component props - derived from UnifiedMenuProps
 * This is a thin wrapper around MenuUnified with variant="dropdown"
 */
export interface DropdownProps<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> extends Omit<UnifiedMenuProps<T, TRouter, TOptions, TFrom>, 'variant' | 'items' | 'children'> {
  /** Dropdown items - type alias for MenuItems for backward compatibility */
  items: IDropdownItems<T, TRouter, TOptions, TFrom>;
  /** Trigger element - optional for backward compatibility with DropdownContent usage */
  children?: React.ReactNode;
}

export type DropdownContentProps<T = string> = Omit<DropdownProps<T>, 'align' | 'side'>;

/**
 * Dropdown component - thin wrapper around MenuUnified with variant="dropdown"
 */
export const DropdownBase = <
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  items,
  selectType,
  menuHeader,
  contentClassName,
  onSelect,
  children,
  align,
  side,
  open,
  onOpenChange,
  emptyStateText,
  className,
  footerContent,
  dir,
  modal,
  menuHeaderClassName,
  sideOffset,
  footerClassName,
  showIndex,
  disabled,
  showEmptyState,
  onScrollToBottom,
}: DropdownProps<T, TRouter, TOptions, TFrom>) => {
  // Provide default empty trigger for backward compatibility with DropdownContent
  const trigger = children || <span />;

  return (
    <MenuUnified<T, TRouter, TOptions, TFrom>
      variant="dropdown"
      items={items}
      selectType={selectType}
      menuHeader={menuHeader}
      contentClassName={contentClassName}
      onSelect={onSelect}
      align={align}
      side={side}
      open={open}
      onOpenChange={onOpenChange}
      emptyStateText={emptyStateText}
      className={className}
      footerContent={footerContent}
      dir={dir}
      modal={modal}
      menuHeaderClassName={menuHeaderClassName}
      sideOffset={sideOffset}
      footerClassName={footerClassName}
      showIndex={showIndex}
      disabled={disabled}
      showEmptyState={showEmptyState}
      onScrollToBottom={onScrollToBottom}
    >
      {trigger}
    </MenuUnified>
  );
};
DropdownBase.displayName = 'Dropdown';

export const Dropdown = React.memo(DropdownBase) as unknown as typeof DropdownBase;

/**
 * @deprecated DropdownContent is no longer needed - MenuUnified handles content rendering
 *
 * This component was previously used to render dropdown content separately.
 * With the unified menu system, use the Dropdown component directly.
 *
 * If you were using this in submenu items, refactor to use the items.items pattern instead.
 */
export const DropdownContent = <T,>(_props: DropdownContentProps<T>): null => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'DropdownContent is deprecated. Use Dropdown component directly. ' +
        'For submenus, use the items.items pattern instead of embedding DropdownContent.'
    );
  }
  return null;
};
