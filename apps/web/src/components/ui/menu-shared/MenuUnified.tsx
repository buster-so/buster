import type { ContextMenuProps as ContextMenuPropsRadix } from '@radix-ui/react-context-menu';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { Link, type RegisteredRouter } from '@tanstack/react-router';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import type { ILinkProps } from '@/types/routes';
import { Checkbox } from '../checkbox/Checkbox';
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLink,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../context-menu/ContextBase';
import {
  DropdownMenu,
  DropdownMenuCheckboxItemMultiple,
  DropdownMenuCheckboxItemSingle,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLink,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown/DropdownBase';
import { Check3 as Check } from '../icons/NucleoIconOutlined';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';
import { MenuHeaderSearch } from './MenuHeaderSearch';
import { menuScrollableContentClass } from './menu-base.styles';
import { useScrollToBottom } from './menu-hooks';
import type { MenuItem, MenuItems } from './menu-items.types';
import { hasValue, menuItemKey, separateSelectedItems } from './menu-utils';

/**
 * Type representing the shared shape of both dropdown and context menu primitives
 */
type MenuPrimitives = {
  Root: typeof DropdownMenu | typeof ContextMenuRoot;
  Trigger: typeof DropdownMenuTrigger | typeof ContextMenuTrigger;
  Content: typeof DropdownMenuContent | typeof ContextMenuContent;
  Portal: typeof DropdownMenuPortal | typeof ContextMenuPortal;
  Item: typeof DropdownMenuItem | typeof ContextMenuItem;
  CheckboxSingle: typeof DropdownMenuCheckboxItemSingle | typeof ContextMenuCheckboxItem;
  CheckboxMultiple: typeof DropdownMenuCheckboxItemMultiple | typeof ContextMenuCheckboxItem;
  Separator: typeof DropdownMenuSeparator | typeof ContextMenuSeparator;
  Shortcut: typeof DropdownMenuShortcut | typeof ContextMenuShortcut;
  Sub: typeof DropdownMenuSub | typeof ContextMenuSub;
  SubTrigger: typeof DropdownMenuSubTrigger | typeof ContextMenuSubTrigger;
  SubContent: typeof DropdownMenuSubContent | typeof ContextMenuSubContent;
  Link: typeof DropdownMenuLink | typeof ContextMenuLink;
};

/**
 * Unified menu props that work for both dropdown and context menus
 */
export interface UnifiedMenuProps<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  /** Whether this is a dropdown (click) or context menu (right-click) */
  variant: 'dropdown' | 'context';
  /** Menu items to display */
  items: MenuItems<T, TRouter, TOptions, TFrom>;
  /** Selection behavior */
  selectType?: 'single' | 'multiple' | 'none' | 'single-selectable-link';
  /** Header content - if string, renders search box */
  menuHeader?: string | React.ReactNode;
  /** Callback when item is selected */
  onSelect?: (value: T) => void;
  /** Alignment for dropdown (ignored for context menu) */
  align?: 'start' | 'center' | 'end';
  /** Side placement for dropdown (ignored for context menu) */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Empty state message */
  emptyStateText?: string | React.ReactNode;
  /** Root container class */
  className?: string;
  /** Footer content */
  footerContent?: React.ReactNode;
  /** Show numeric hotkeys (0-9) */
  showIndex?: boolean;
  /** Content area class */
  contentClassName?: string;
  /** Footer class */
  footerClassName?: string;
  /** Side offset in pixels */
  sideOffset?: number;
  /** Disable the menu */
  disabled?: boolean;
  /** Menu header class */
  menuHeaderClassName?: string;
  /** Show empty state */
  showEmptyState?: boolean;
  /** Scroll pagination callback */
  onScrollToBottom?: () => void;
  /** Controlled open state */
  open?: boolean;
  /** Open state change callback */
  onOpenChange?: (open: boolean) => void;
  /** Text direction */
  dir?: 'ltr' | 'rtl';
  /** Modal behavior */
  modal?: boolean;
  /** Trigger element */
  children: React.ReactNode;
}

/**
 * Unified Menu component that works as both Dropdown and ContextMenu
 * All logic is shared - only the Radix primitives are swapped based on variant
 */
export const MenuUnified = <
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  variant,
  items,
  selectType = 'none',
  menuHeader,
  contentClassName = '',
  onSelect,
  children,
  align = 'start',
  side = 'bottom',
  open,
  onOpenChange,
  emptyStateText = 'No items found',
  className,
  footerContent,
  dir,
  modal,
  menuHeaderClassName,
  sideOffset,
  footerClassName = '',
  showIndex = false,
  disabled = false,
  showEmptyState = true,
  onScrollToBottom,
}: UnifiedMenuProps<T, TRouter, TOptions, TFrom>) => {
  // Select primitives based on variant
  const primitives = useMemo(() => {
    if (variant === 'dropdown') {
      return {
        Root: DropdownMenu,
        Trigger: DropdownMenuTrigger,
        Content: DropdownMenuContent,
        Portal: DropdownMenuPortal,
        Item: DropdownMenuItem,
        CheckboxSingle: DropdownMenuCheckboxItemSingle,
        CheckboxMultiple: DropdownMenuCheckboxItemMultiple,
        Separator: DropdownMenuSeparator,
        Shortcut: DropdownMenuShortcut,
        Sub: DropdownMenuSub,
        SubTrigger: DropdownMenuSubTrigger,
        SubContent: DropdownMenuSubContent,
        Link: DropdownMenuLink,
      };
    }
    return {
      Root: ContextMenuRoot,
      Trigger: ContextMenuTrigger,
      Content: ContextMenuContent,
      Portal: ContextMenuPortal,
      Item: ContextMenuItem,
      CheckboxSingle: ContextMenuCheckboxItem,
      CheckboxMultiple: ContextMenuCheckboxItem,
      Separator: ContextMenuSeparator,
      Shortcut: ContextMenuShortcut,
      Sub: ContextMenuSub,
      SubTrigger: ContextMenuSubTrigger,
      SubContent: ContextMenuSubContent,
      Link: ContextMenuLink,
    };
  }, [variant]);

  const { Root, Trigger, Content } = primitives;

  return (
    <Root open={open} defaultOpen={open} onOpenChange={onOpenChange} dir={dir} modal={modal}>
      <Trigger asChild disabled={disabled}>
        <span className={variant === 'dropdown' ? 'dropdown-trigger' : undefined}>{children}</span>
      </Trigger>
      <Content
        className={cn(
          variant === 'dropdown' ? 'max-w-62 min-w-62' : 'max-w-72 min-w-44',
          className
        )}
        align={variant === 'dropdown' ? align : undefined}
        side={variant === 'dropdown' ? side : undefined}
        sideOffset={sideOffset}
      >
        <MenuContentRenderer<T, TRouter, TOptions, TFrom>
          variant={variant}
          items={items}
          selectType={selectType}
          menuHeader={menuHeader}
          onSelect={onSelect}
          showIndex={showIndex}
          emptyStateText={emptyStateText}
          footerContent={footerContent}
          className={contentClassName}
          footerClassName={footerClassName}
          menuHeaderClassName={menuHeaderClassName}
          showEmptyState={showEmptyState}
          onScrollToBottom={onScrollToBottom}
          primitives={primitives}
        />
      </Content>
    </Root>
  );
};

interface MenuContentRendererProps<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> extends Omit<UnifiedMenuProps<T, TRouter, TOptions, TFrom>, 'variant' | 'children'> {
  variant: 'dropdown' | 'context';
  primitives: MenuPrimitives;
}

/**
 * Shared content renderer used by both variants
 */
function MenuContentRenderer<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  variant,
  items,
  selectType,
  menuHeader,
  showIndex,
  emptyStateText,
  footerContent,
  className,
  menuHeaderClassName,
  footerClassName,
  showEmptyState,
  onSelect,
  onScrollToBottom,
  primitives,
}: MenuContentRendererProps<T, TRouter, TOptions, TFrom>) {
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items,
    searchPredicate: (item, searchText) => {
      if (hasValue<T, TRouter, TOptions, TFrom>(item)) {
        const _item = item;
        const searchContent =
          _item.searchLabel || (typeof _item.label === 'string' ? _item.label : '');
        return searchContent?.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    },
    debounceTime: 50,
  });

  const handleScroll = useScrollToBottom(onScrollToBottom);

  const hasShownItem = useMemo(() => {
    return (
      filteredItems.length > 0 &&
      filteredItems.some((item) => hasValue<T, TRouter, TOptions, TFrom>(item))
    );
  }, [filteredItems]);

  const { selectedItems, unselectedItems } = useMemo(() => {
    if (selectType === 'multiple') {
      return separateSelectedItems<T, TRouter, TOptions, TFrom>(filteredItems);
    }
    return {
      selectedItems: [],
      unselectedItems: [],
    };
  }, [selectType, filteredItems]);

  let hotkeyIndex = -1;
  const dropdownItems = selectType === 'multiple' ? unselectedItems : filteredItems;

  const onSelectItem = useMemoizedFn((index: number) => {
    const correctIndex = dropdownItems.filter((item) =>
      hasValue<T, TRouter, TOptions, TFrom>(item)
    );
    const item = correctIndex[index];

    if (item && item.value !== undefined) {
      const disabled = item.disabled;
      if (!disabled && onSelect) {
        onSelect(item.value);
        if (item.closeOnSelect !== false) {
          const menuTrigger = document.querySelector('[data-state="open"][role="menu"]');
          if (menuTrigger) {
            const closeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            menuTrigger.dispatchEvent(closeEvent);
          }
        }
      }
    }
  });

  console.log(!hasShownItem, showEmptyState, emptyStateText);

  return (
    <>
      {menuHeader && (
        <div className="flex flex-col">
          <div className={cn('p-1', menuHeaderClassName)}>
            <MenuHeaderSelector
              menuHeader={menuHeader}
              onChange={handleSearchChange}
              text={searchText}
              onSelectItem={onSelectItem}
              showIndex={showIndex || false}
            />
          </div>
          <div className="bg-border h-[0.5px] w-full" />
        </div>
      )}

      <div
        className={cn(menuScrollableContentClass, className)}
        onScroll={handleScroll}
        onWheel={(e) => e.stopPropagation()}
      >
        {hasShownItem ? (
          <>
            {selectedItems.map((item, index) => {
              if (hasValue<T, TRouter, TOptions, TFrom>(item) && !item.items) {
                hotkeyIndex++;
              }
              return (
                <MenuItemRenderer<T, TRouter, TOptions, TFrom>
                  key={menuItemKey<T, TRouter, TOptions, TFrom>(item, index)}
                  variant={variant}
                  item={item as MenuItem<T, TRouter, TOptions, TFrom>}
                  index={hotkeyIndex}
                  selectType={
                    (item as MenuItem<T, TRouter, TOptions, TFrom>).selectType ||
                    selectType ||
                    'none'
                  }
                  onSelect={onSelect}
                  onSelectItem={onSelectItem}
                  closeOnSelect={
                    (item as MenuItem<T, TRouter, TOptions, TFrom>).closeOnSelect ?? true
                  }
                  showIndex={showIndex || false}
                  emptyStateText={emptyStateText}
                  primitives={primitives}
                />
              );
            })}

            {selectedItems.length > 0 && <primitives.Separator />}

            {dropdownItems.map((item, index) => {
              if (hasValue<T, TRouter, TOptions, TFrom>(item) && !item.items) {
                hotkeyIndex++;
              }
              return (
                <MenuItemRenderer<T, TRouter, TOptions, TFrom>
                  key={menuItemKey<T, TRouter, TOptions, TFrom>(item, index)}
                  variant={variant}
                  item={item as MenuItem<T, TRouter, TOptions, TFrom>}
                  index={hotkeyIndex}
                  selectType={
                    (item as MenuItem<T, TRouter, TOptions, TFrom>).selectType ||
                    selectType ||
                    'none'
                  }
                  onSelect={onSelect}
                  onSelectItem={onSelectItem}
                  closeOnSelect={
                    (item as MenuItem<T, TRouter, TOptions, TFrom>).closeOnSelect ?? true
                  }
                  showIndex={showIndex || false}
                  emptyStateText={emptyStateText}
                  primitives={primitives}
                />
              );
            })}
          </>
        ) : (
          showEmptyState && (
            <primitives.Item disabled className="text-gray-light text-center">
              {emptyStateText}
            </primitives.Item>
          )
        )}
      </div>

      {footerContent && (
        <div className={cn(hasShownItem && 'border-t', 'p-1', footerClassName)}>
          {footerContent}
        </div>
      )}
    </>
  );
}

interface MenuItemRendererProps<
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  variant: 'dropdown' | 'context';
  item: MenuItem<T, TRouter, TOptions, TFrom>;
  index: number;
  selectType: 'single' | 'multiple' | 'none' | 'single-selectable-link';
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  closeOnSelect: boolean;
  showIndex: boolean;
  emptyStateText?: string | React.ReactNode;
  primitives: MenuPrimitives;
}

/**
 * Shared item renderer
 */
function MenuItemRenderer<
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  variant,
  item,
  index,
  selectType,
  onSelect,
  onSelectItem,
  closeOnSelect,
  showIndex,
  primitives,
}: MenuItemRendererProps<T, TRouter, TOptions, TFrom>) {
  const {
    label,
    value,
    shortcut,
    onClick,
    icon,
    disabled = false,
    loading,
    selected,
    items,
    secondaryLabel,
    truncate,
    link,
    linkIcon,
    className,
  } = item;

  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (onSelect && value !== undefined) onSelect(value);
  });

  const enabledHotKeys = variant === 'dropdown' && showIndex && !disabled && !!onSelectItem;

  useHotkeys(`${index}`, onClickItem, {
    enabled: enabledHotKeys,
  });

  const isSubItem = items && items.length > 0;
  const isSelectable = selectType !== 'none' && selectType !== 'single-selectable-link';

  const renderContent = () => {
    const content = (
      <>
        {icon && <span className="text-icon-color text-lg">{icon}</span>}
        <div className={cn('flex flex-col space-y-1', truncate && 'overflow-hidden')}>
          <span className={cn(truncate && 'truncate')}>{label}</span>
          {secondaryLabel && <span className="text-gray-light text-xs">{secondaryLabel}</span>}
        </div>
        {loading && <CircleSpinnerLoader size={9} />}
        {shortcut && <primitives.Shortcut>{shortcut}</primitives.Shortcut>}
        {link && isSelectable && (
          <primitives.Link
            className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100"
            link={link as string | ILinkProps}
            linkIcon={linkIcon}
            linkTarget={item.linkTarget}
          />
        )}
      </>
    );

    if (!isSelectable && link) {
      const linkClassName = 'flex w-full items-center gap-x-2';
      if (typeof link === 'string') {
        const isExternal = link.startsWith('http');
        return (
          <a href={link} target={isExternal ? '_blank' : '_self'} className={linkClassName}>
            {content}
          </a>
        );
      }
      return (
        <Link className={linkClassName} {...(link as ILinkProps<TRouter, TOptions, TFrom>)}>
          {content}
        </Link>
      );
    }

    return content;
  };

  if (isSubItem) {
    return (
      <primitives.Sub>
        <primitives.SubTrigger>{renderContent()}</primitives.SubTrigger>
        <primitives.Portal>
          <primitives.SubContent
            sideOffset={8}
            className={cn('sub-menu', menuScrollableContentClass, className)}
          >
            {/* Render sub items recursively */}
            {items?.map((subItem, subIndex) => (
              <MenuItemRenderer<T, TRouter, TOptions, TFrom>
                key={menuItemKey<T, TRouter, TOptions, TFrom>(
                  subItem as unknown as MenuItems<T, TRouter, TOptions, TFrom>[number],
                  subIndex
                )}
                variant={variant}
                item={subItem as unknown as MenuItem<T, TRouter, TOptions, TFrom>}
                index={subIndex}
                selectType={selectType}
                onSelect={onSelect}
                onSelectItem={onSelectItem}
                closeOnSelect={closeOnSelect}
                showIndex={showIndex}
                primitives={primitives}
              />
            ))}
          </primitives.SubContent>
        </primitives.Portal>
      </primitives.Sub>
    );
  }

  if (selectType === 'single' || selectType === 'single-selectable-link') {
    return (
      <primitives.CheckboxSingle
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        index={variant === 'dropdown' && showIndex ? index : undefined}
        closeOnSelect={closeOnSelect}
      >
        {renderContent()}
        {variant === 'dropdown' && (
          <span className="absolute right-2 flex h-3.5 w-fit items-center justify-center space-x-1">
            {selected && (
              <div className="text-icon-color flex items-center justify-center text-sm">
                <Check />
              </div>
            )}
            {showIndex && index !== undefined && (
              <span className="text-gray-dark ml-auto w-2 text-center">{index}</span>
            )}
          </span>
        )}
        {variant === 'context' && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            {selected && (
              <div className="flex h-4 w-4 items-center justify-center">
                <Check />
              </div>
            )}
          </span>
        )}
      </primitives.CheckboxSingle>
    );
  }

  if (selectType === 'multiple') {
    return (
      <primitives.CheckboxMultiple
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        closeOnSelect={closeOnSelect}
        dataTestId={`menu-checkbox-${value}`}
      >
        <span
          className={cn(
            'absolute left-2 flex h-3.5 w-3.5 items-center justify-center opacity-0 group-hover:opacity-100',
            selected && 'opacity-100'
          )}
        >
          <Checkbox size="default" checked={selected} />
        </span>
        {renderContent()}
      </primitives.CheckboxMultiple>
    );
  }

  return (
    <primitives.Item
      truncate={truncate}
      disabled={disabled}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}
    >
      {renderContent()}
    </primitives.Item>
  );
}

/**
 * Shared menu header component that renders search or custom header content
 * Works for both dropdown and context menu
 */
const MenuHeaderSelector = <T,>({
  menuHeader,
  onChange,
  onSelectItem,
  text,
  showIndex,
}: {
  menuHeader: NonNullable<UnifiedMenuProps<T>['menuHeader']>;
  onSelectItem: (index: number) => void;
  onChange: (text: string) => void;
  text: string;
  showIndex: boolean;
}) => {
  if (typeof menuHeader === 'string') {
    return (
      <MenuHeaderSearch
        showIndex={showIndex}
        placeholder={menuHeader}
        onChange={onChange}
        onSelectItem={onSelectItem}
        text={text}
      />
    );
  }
  return menuHeader;
};
