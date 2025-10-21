import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { Link, type RegisteredRouter } from '@tanstack/react-router';
import React, { useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';
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
} from './DropdownBase';
import { DropdownMenuHeaderSearch } from './DropdownMenuHeaderSearch';
import type { DropdownDivider, IDropdownItem, IDropdownItems } from './dropdown-items.types';

export interface DropdownProps<
  T = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> extends DropdownMenuProps {
  items: IDropdownItems<T, TRouter, TOptions, TFrom>;
  selectType?: 'single' | 'multiple' | 'none' | 'single-selectable-link';
  menuHeader?: string | React.ReactNode; //if string it will render a search box
  onSelect?: (value: T) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  emptyStateText?: string | React.ReactNode;
  className?: string;
  footerContent?: React.ReactNode;
  showIndex?: boolean;
  contentClassName?: string;
  footerClassName?: string;
  sideOffset?: number;
  disabled?: boolean;
  menuHeaderClassName?: string;
  showEmptyState?: boolean;
  onScrollToBottom?: () => void;
}

export type DropdownContentProps<T = string> = Omit<DropdownProps<T>, 'align' | 'side'>;

const dropdownItemKey = <T,>(item: IDropdownItems<T>[number], index: number): string => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  if ((item as IDropdownItem<T>).value) return String((item as IDropdownItem<T>).value);
  return `item-${index}`;
};

/**
 * Hook to handle scroll-to-bottom detection
 * Fires callback when user scrolls within threshold distance of bottom
 * Only fires when entering the zone, not while remaining in it
 */
const useScrollToBottom = (
  onScrollToBottom?: () => void,
  threshold = 15
): ((e: React.UIEvent<HTMLDivElement>) => void) => {
  const isInBottomZoneRef = React.useRef(false);

  const handleScroll = useMemoizedFn((e: React.UIEvent<HTMLDivElement>) => {
    if (!onScrollToBottom) return;

    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isNowInZone = scrollBottom <= threshold;

    // Only fire when entering the zone (not already in it)
    if (isNowInZone && !isInBottomZoneRef.current) {
      onScrollToBottom();
    }

    // Update the ref to track current state
    isInBottomZoneRef.current = isNowInZone;
  });

  return handleScroll;
};

export const DropdownBase = <T,>({
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
  emptyStateText,
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
}: DropdownProps<T>) => {
  return (
    <DropdownMenu
      open={open}
      defaultOpen={open}
      onOpenChange={onOpenChange}
      dir={dir}
      modal={modal}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        <span className="dropdown-trigger">{children}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn('max-w-62 min-w-62', className)}
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownContent
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
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
DropdownBase.displayName = 'Dropdown';
export const Dropdown = React.memo(DropdownBase) as unknown as typeof DropdownBase;

export const DropdownContent = <T,>({
  items,
  selectType,
  menuHeader,
  showIndex = false,
  emptyStateText = 'No items found',
  footerContent,
  className,
  menuHeaderClassName,
  footerClassName,
  showEmptyState,
  onSelect,
  onScrollToBottom,
}: DropdownContentProps<T>) => {
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items,
    searchPredicate: (item, searchText) => {
      if ((item as IDropdownItem<T>).value) {
        const _item = item as IDropdownItem<T>;
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
      filteredItems.length > 0 && filteredItems.some((item) => (item as IDropdownItem<T>).value)
    );
  }, [filteredItems]);

  const { selectedItems, unselectedItems } = useMemo(() => {
    if (selectType === 'multiple') {
      const [selectedItems, unselectedItems] = filteredItems.reduce(
        (acc, item) => {
          if ((item as IDropdownItem<T>).selected) {
            acc[0].push(item);
          } else {
            acc[1].push(item);
          }
          return acc;
        },
        [[], []] as [typeof filteredItems, typeof filteredItems]
      );
      return { selectedItems, unselectedItems };
    }
    return {
      selectedItems: [],
      unselectedItems: [],
    };
  }, [selectType, filteredItems]);

  // Keep track of selectable item index
  let hotkeyIndex = -1;

  const dropdownItems = selectType === 'multiple' ? unselectedItems : filteredItems;

  const onSelectItem = useMemoizedFn((index: number) => {
    const correctIndex = dropdownItems.filter((item) => (item as IDropdownItem<T>).value);
    const item = correctIndex[index] as IDropdownItem<T>;

    if (item) {
      const disabled = (item as IDropdownItem<T>).disabled;
      if (!disabled && onSelect) {
        onSelect(item.value);
        // Close the dropdown if closeOnSelect is true
        if (item.closeOnSelect !== false) {
          const dropdownTrigger = document.querySelector('[data-state="open"][role="menu"]');
          if (dropdownTrigger) {
            const closeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            dropdownTrigger.dispatchEvent(closeEvent);
          }
        }
      }
    }
  });

  return (
    <>
      {menuHeader && (
        <div className="flex flex-col">
          <div className={cn('p-1', menuHeaderClassName)}>
            <DropdownMenuHeaderSelector
              menuHeader={menuHeader}
              onChange={handleSearchChange}
              text={searchText}
              onSelectItem={onSelectItem}
              showIndex={showIndex}
            />
          </div>
          <div className="bg-border h-[0.5px] w-full" />
        </div>
      )}

      <div
        className={cn('max-h-[375px] overflow-y-auto', className)}
        onScroll={handleScroll}
        onWheel={(e) => {
          //this is need to prevent bug when it is inside a dialog or modal
          e.stopPropagation();
        }}
      >
        {hasShownItem ? (
          <>
            {selectedItems.map((item, index) => {
              // Only increment index for selectable items
              if ((item as IDropdownItem<T>).value && !(item as IDropdownItem<T>).items) {
                hotkeyIndex++;
              }

              return (
                <DropdownItemSelector
                  key={dropdownItemKey(item, index)}
                  item={item}
                  index={hotkeyIndex}
                  selectType={(item as IDropdownItem<T>).selectType || selectType}
                  onSelect={onSelect}
                  onSelectItem={onSelectItem}
                  closeOnSelect={(item as IDropdownItem<T>).closeOnSelect !== false}
                  showIndex={showIndex}
                />
              );
            })}

            {selectedItems.length > 0 && <DropdownMenuSeparator />}

            {dropdownItems.map((item, index) => {
              // Only increment index for selectable items
              if ((item as IDropdownItem<T>).value && !(item as IDropdownItem<T>).items) {
                hotkeyIndex++;
              }

              return (
                <DropdownItemSelector
                  key={dropdownItemKey(item, index)}
                  item={item}
                  index={hotkeyIndex}
                  selectType={(item as IDropdownItem<T>).selectType || selectType}
                  onSelect={onSelect}
                  onSelectItem={onSelectItem}
                  closeOnSelect={(item as IDropdownItem<T>).closeOnSelect !== false}
                  showIndex={showIndex}
                />
              );
            })}
          </>
        ) : (
          showEmptyState && (
            <DropdownMenuItem disabled className="text-gray-light text-center">
              {emptyStateText}
            </DropdownMenuItem>
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
};

const DropdownItemSelector = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  item,
  index,
  onSelect,
  onSelectItem,
  closeOnSelect,
  selectType,
  showIndex,
}: {
  item: IDropdownItems<T, TRouter, TOptions, TFrom>[number];
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: I had a devil of a time trying to type this... This is a hack to get the type to work
  onSelect?: (value: any) => void; // Using any here to resolve the type mismatch
  onSelectItem: (index: number) => void;
  closeOnSelect: boolean;
  showIndex: boolean;
  selectType: DropdownProps<T>['selectType'];
}) => {
  if ((item as DropdownDivider).type === 'divider') {
    return <DropdownMenuSeparator />;
  }

  if (typeof item === 'object' && React.isValidElement(item)) {
    return item;
  }

  // Type guard to ensure item is a DropdownItem
  if (!item || typeof item !== 'object' || !('value' in item)) {
    return null;
  }

  return (
    <DropdownItem<T, TRouter, TOptions, TFrom>
      closeOnSelect={closeOnSelect}
      onSelect={onSelect}
      onSelectItem={onSelectItem}
      selectType={selectType}
      index={index}
      showIndex={showIndex}
      {...item}
    />
  );
};
DropdownItemSelector.displayName = 'DropdownItemSelector';

const DropdownItem = <
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  label,
  value,
  showIndex,
  shortcut,
  onClick,
  icon,
  disabled = false,
  loading,
  selected,
  index,
  items,
  closeOnSelect,
  onSelect,
  onSelectItem,
  selectType,
  secondaryLabel,
  truncate,
  link,
  linkIcon,
  className,
  menuHeader,
  onSearch,
  onScrollToBottom,
}: IDropdownItem<T, TRouter, TOptions, TFrom> & {
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  closeOnSelect: boolean;
  index: number;
  showIndex: boolean;
}) => {
  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement> | KeyboardEvent) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (onSelect) onSelect(value as T);
  });
  const enabledHotKeys = showIndex && !disabled && !!onSelectItem;

  // Add hotkey support when showIndex is true
  useHotkeys(`${index}`, onClickItem, {
    enabled: enabledHotKeys,
  });

  const isSubItem = items && items.length > 0;
  const isSelectable =
    !!selectType && selectType !== 'none' && selectType !== 'single-selectable-link';

  // Helper function to render the content consistently with proper type safety
  const renderContent = () => {
    const content = (
      <>
        {icon && <span className="text-icon-color text-lg">{icon}</span>}
        <div className={cn('flex flex-col space-y-1', truncate && 'overflow-hidden')}>
          <span className={cn(truncate && 'truncate')}>{label}</span>
          {secondaryLabel && <span className="text-gray-light text-xs">{secondaryLabel}</span>}
        </div>
        {loading && <CircleSpinnerLoader size={9} />}
        {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        {link && (
          <DropdownMenuLink<TRouter, TOptions, TFrom>
            className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100"
            link={isSelectable ? link : null}
            linkIcon={linkIcon}
          />
        )}
      </>
    );

    // Wrap with Link if needed
    if (!isSelectable && link) {
      const className = 'flex w-full items-center gap-x-2';
      if (typeof link === 'string') {
        const isExternal = link.startsWith('http');
        return (
          <a href={link} target={isExternal ? '_blank' : '_self'} className={className}>
            {content}
          </a>
        );
      }

      return (
        <Link className={className} {...link}>
          {content}
        </Link>
      );
    }

    return content;
  };

  if (isSubItem) {
    return (
      <DropdownSubMenuWrapper
        items={items}
        closeOnSelect={closeOnSelect}
        onSelect={onSelect}
        onSelectItem={onSelectItem}
        showIndex={showIndex}
        selectType={selectType}
        className={className}
        parentItem={{
          menuHeader,
          onSearch,
          onScrollToBottom,
        }}
      >
        {renderContent()}
      </DropdownSubMenuWrapper>
    );
  }

  //I do not think this selected check is stable... look into refactoring
  if (selectType === 'single' || selectType === 'single-selectable-link') {
    return (
      <DropdownMenuCheckboxItemSingle
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        index={showIndex ? index : undefined}
        closeOnSelect={closeOnSelect}
      >
        {renderContent()}
      </DropdownMenuCheckboxItemSingle>
    );
  }

  if (selectType === 'multiple') {
    return (
      <DropdownMenuCheckboxItemMultiple
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        closeOnSelect={closeOnSelect}
        dataTestId={`dropdown-checkbox-${value}`}
      >
        {renderContent()}
      </DropdownMenuCheckboxItemMultiple>
    );
  }

  return (
    <DropdownMenuItem
      truncate={truncate}
      disabled={disabled}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}
    >
      {renderContent()}
    </DropdownMenuItem>
  );
};

interface DropdownSubMenuWrapperProps<T> {
  items: IDropdownItems<T> | undefined;
  children: React.ReactNode;
  closeOnSelect: boolean;
  showIndex: boolean;
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  selectType: DropdownProps<T>['selectType'];
  className?: string;
  parentItem?: {
    menuHeader?: string | React.ReactNode;
    onSearch?: (search: string) => void;
    onScrollToBottom?: () => void;
  };
}

const DropdownSubMenuWrapper = <T,>({
  items,
  children,
  closeOnSelect,
  onSelect,
  onSelectItem,
  selectType,
  showIndex,
  className,
  parentItem,
}: DropdownSubMenuWrapperProps<T>) => {
  const subContentRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const scrollToSelectedItem = React.useCallback(() => {
    if (!subContentRef.current) return;

    const selectedIndex = items?.findIndex((item) => (item as IDropdownItem<T>).selected);
    if (selectedIndex === undefined || selectedIndex === -1) return;

    const menuItems = subContentRef.current.querySelectorAll('[role="menuitem"]');
    const selectedElement = menuItems[selectedIndex - 1];

    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'start', behavior: 'instant', inline: 'start' });
    }
  }, [items]);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(scrollToSelectedItem, 70);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, scrollToSelectedItem]);

  return (
    <DropdownMenuSub onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger>{children}</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          ref={subContentRef}
          sideOffset={8}
          className={cn('sub-menu', className)}
        >
          <DropdownSubMenuContent
            items={items}
            onSelect={onSelect}
            onSelectItem={onSelectItem}
            closeOnSelect={closeOnSelect}
            selectType={selectType}
            showIndex={showIndex}
            menuHeader={parentItem?.menuHeader}
            onSearch={parentItem?.onSearch}
            onScrollToBottom={parentItem?.onScrollToBottom}
          />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

interface DropdownSubMenuContentProps<T> {
  items: IDropdownItems<T> | undefined;
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  closeOnSelect: boolean;
  selectType: DropdownProps<T>['selectType'];
  showIndex: boolean;
  menuHeader?: string | React.ReactNode;
  onSearch?: (search: string) => void;
  onScrollToBottom?: () => void;
}

const DropdownSubMenuContent = <T,>({
  items,
  onSelect,
  onSelectItem,
  closeOnSelect,
  selectType,
  showIndex,
  menuHeader,
  onSearch,
  onScrollToBottom,
}: DropdownSubMenuContentProps<T>) => {
  // When onSearch is provided, parent handles filtering - don't filter locally
  const shouldUseLocalFiltering = !onSearch;

  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: items || [],
    searchPredicate: (item, searchText) => {
      // If parent handles filtering, don't filter locally
      if (!shouldUseLocalFiltering) return true;

      if ((item as IDropdownItem<T>).value) {
        const _item = item as IDropdownItem<T>;
        const searchContent =
          _item.searchLabel || (typeof _item.label === 'string' ? _item.label : '');
        return searchContent?.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    },
    debounceTime: 50,
  });

  const handleScroll = useScrollToBottom(onScrollToBottom);

  // Call onSearch callback when search text changes
  useEffect(() => {
    if (onSearch) {
      onSearch(searchText);
    }
  }, [onSearch, searchText]);

  const hasShownItem = useMemo(() => {
    return (
      filteredItems.length > 0 && filteredItems.some((item) => (item as IDropdownItem<T>).value)
    );
  }, [filteredItems]);

  return (
    <>
      {menuHeader && (
        <div className="flex flex-col">
          <div className="p-1">
            <DropdownMenuHeaderSelector
              menuHeader={menuHeader}
              onChange={handleSearchChange}
              text={searchText}
              onSelectItem={onSelectItem}
              showIndex={showIndex}
            />
          </div>
          <div className="bg-border h-[0.5px] w-full" />
        </div>
      )}

      <div
        className="max-h-[375px] overflow-y-auto"
        onScroll={handleScroll}
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        {hasShownItem ? (
          filteredItems.map((item, index) => (
            <DropdownItemSelector
              key={dropdownItemKey(item, index)}
              item={item}
              index={index}
              onSelect={onSelect}
              onSelectItem={onSelectItem}
              closeOnSelect={closeOnSelect}
              selectType={(item as IDropdownItem<T>).selectType || selectType}
              showIndex={showIndex}
            />
          ))
        ) : (
          <DropdownMenuItem disabled className="text-gray-light text-center">
            No items found
          </DropdownMenuItem>
        )}
      </div>
    </>
  );
};

const DropdownMenuHeaderSelector = <T,>({
  menuHeader,
  onChange,
  onSelectItem,
  text,
  showIndex,
}: {
  menuHeader: NonNullable<DropdownProps<T>['menuHeader']>;
  onSelectItem: (index: number) => void;
  onChange: (text: string) => void;
  text: string;
  showIndex: boolean;
}) => {
  if (typeof menuHeader === 'string') {
    return (
      <DropdownMenuHeaderSearch
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
DropdownMenuHeaderSelector.displayName = 'DropdownMenuHeaderSelector';
