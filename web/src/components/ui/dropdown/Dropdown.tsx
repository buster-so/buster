import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React, { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup, //Do I need this?
  DropdownMenuLabel, //Do I need this?
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItemSingle,
  DropdownMenuCheckboxItemMultiple,
  DropdownMenuLink
} from './DropdownBase';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';
import { useMemoizedFn } from 'ahooks';
import { cn } from '@/lib/classMerge';
import { Input } from '../inputs/Input';
import { useDebounceSearch } from '@/hooks';
import Link from 'next/link';
import { useHotkeys } from 'react-hotkeys-hook';

export interface DropdownItem<T = string> {
  label: React.ReactNode | string;
  truncate?: boolean;
  searchLabel?: string; // Used for filtering
  secondaryLabel?: string;
  value: T;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: DropdownItems<T>;
  link?: string;
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right';
}

export interface DropdownDivider {
  type: 'divider';
}

export type DropdownItems<T = string> = (DropdownItem<T> | DropdownDivider | React.ReactNode)[];

export interface DropdownProps<T = string> extends DropdownMenuProps {
  items: DropdownItems<T>;
  selectType?: 'single' | 'multiple' | 'none';
  menuHeader?: string | React.ReactNode; //if string it will render a search box
  closeOnSelect?: boolean;
  onSelect?: (value: T) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  emptyStateText?: string;
  className?: string;
  footerContent?: React.ReactNode;
  showIndex?: boolean;
}

const dropdownItemKey = <T,>(item: DropdownItems<T>[number], index: number): string => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  if ((item as DropdownItem<T>).value) return String((item as DropdownItem<T>).value);
  return `item-${index}`;
};

export const DropdownBase = <T,>({
  items,
  selectType = 'none',
  menuHeader,
  closeOnSelect = true,
  onSelect,
  children,
  align = 'center',
  side = 'bottom',
  open,
  onOpenChange,
  emptyStateText = 'No items found',
  className,
  footerContent,
  dir,
  modal,
  showIndex = false
}: DropdownProps<T>) => {
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items,
    searchPredicate: (item, searchText) => {
      if ((item as DropdownItem).value) {
        const _item = item as DropdownItem;
        const searchContent =
          _item.searchLabel || (typeof _item.label === 'string' ? _item.label : '');
        return searchContent?.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    },
    debounceTime: 50
  });

  const hasShownItem = useMemo(() => {
    return filteredItems.length > 0 && filteredItems.some((item) => (item as DropdownItem).value);
  }, [filteredItems]);

  const { selectedItems, unselectedItems } = useMemo(() => {
    if (selectType === 'multiple') {
      const [selectedItems, unselectedItems] = filteredItems.reduce(
        (acc, item) => {
          if ((item as DropdownItem).selected) {
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
      unselectedItems: []
    };
  }, [selectType, filteredItems]);

  // Keep track of selectable item index
  let hotkeyIndex = -1;

  const dropdownItems = selectType === 'multiple' ? unselectedItems : filteredItems;

  const onSelectItem = useMemoizedFn((index: number) => {
    const correctIndex = dropdownItems.filter((item) => (item as DropdownItem).value);
    const item = correctIndex[index] as DropdownItem<T>;

    if (item) {
      const disabled = (item as DropdownItem).disabled;
      if (!disabled && onSelect) {
        onSelect(item.value);
        // Close the dropdown if closeOnSelect is true
        if (closeOnSelect) {
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
    <DropdownMenu
      open={open}
      defaultOpen={open}
      onOpenChange={onOpenChange}
      dir={dir}
      modal={modal}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn('max-w-72 min-w-44', className)}
        align={align}
        side={side}
        footerContent={footerContent}>
        {menuHeader && (
          <>
            <DropdownMenuHeaderSelector
              menuHeader={menuHeader}
              onChange={handleSearchChange}
              text={searchText}
              onSelectItem={onSelectItem}
              showIndex={showIndex}
            />
            <DropdownMenuSeparator />
          </>
        )}

        <div className="max-h-[375px] overflow-y-auto">
          {hasShownItem ? (
            <>
              {selectedItems.map((item) => {
                // Only increment index for selectable items
                if ((item as DropdownItem).value && !(item as DropdownItem).items) {
                  hotkeyIndex++;
                }

                return (
                  <DropdownItemSelector
                    key={dropdownItemKey(item, hotkeyIndex)}
                    item={item}
                    index={hotkeyIndex}
                    selectType={selectType}
                    onSelect={onSelect}
                    onSelectItem={onSelectItem}
                    closeOnSelect={closeOnSelect}
                    showIndex={showIndex}
                  />
                );
              })}

              {selectedItems.length > 0 && <DropdownMenuSeparator />}

              {dropdownItems.map((item) => {
                // Only increment index for selectable items
                if ((item as DropdownItem).value && !(item as DropdownItem).items) {
                  hotkeyIndex++;
                }

                return (
                  <DropdownItemSelector
                    item={item as DropdownItems<T>[number]}
                    index={hotkeyIndex}
                    selectType={selectType}
                    onSelect={onSelect}
                    onSelectItem={onSelectItem}
                    closeOnSelect={closeOnSelect}
                    key={dropdownItemKey(item, hotkeyIndex)}
                    showIndex={showIndex}
                  />
                );
              })}
            </>
          ) : (
            <DropdownMenuItem disabled className="text-gray-light text-center">
              {emptyStateText}
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
DropdownBase.displayName = 'Dropdown';
export const Dropdown = React.memo(DropdownBase) as unknown as typeof DropdownBase;

const DropdownItemSelector = React.memo(
  <T,>({
    item,
    index,
    onSelect,
    onSelectItem,
    closeOnSelect,
    selectType,
    showIndex
  }: {
    item: DropdownItems<T>[number];
    index: number;
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

    return (
      <DropdownItem
        {...(item as DropdownItem<T>)}
        closeOnSelect={closeOnSelect}
        onSelect={onSelect}
        onSelectItem={onSelectItem}
        selectType={selectType}
        index={index}
        showIndex={showIndex}
      />
    );
  }
);
DropdownItemSelector.displayName = 'DropdownItemSelector';

const DropdownItem = <T,>({
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
  linkIcon
}: DropdownItem<T> & {
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  closeOnSelect: boolean;
  index: number;
  showIndex: boolean;
  selectType: DropdownProps<T>['selectType'];
}) => {
  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick();
    if (onSelect) onSelect(value as T);
  });
  const enabledHotKeys = showIndex && !disabled && !!onSelectItem;

  // Add hotkey support when showIndex is true
  useHotkeys(showIndex ? `${index}` : '', (e) => onSelectItem(index), {
    enabled: enabledHotKeys
  });

  const isSubItem = items && items.length > 0;
  const isSelectable = !!selectType && selectType !== 'none';

  // Helper function to render the content consistently with proper type safety
  const renderContent = () => {
    const content = (
      <>
        {icon && !loading && <span className="text-icon-color">{icon}</span>}
        {loading && <CircleSpinnerLoader size={9} />}
        <div className={cn('flex flex-col gap-y-1', truncate && 'overflow-hidden')}>
          <span className={cn(truncate && 'truncate')}>{label}</span>
          {secondaryLabel && <span className="text-gray-light text2xs">{secondaryLabel}</span>}
        </div>
        {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        {link && (
          <DropdownMenuLink
            className="-mr-1 ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100"
            link={isSelectable ? link : null}
            linkIcon={linkIcon}
          />
        )}
      </>
    );

    // Wrap with Link if needed
    if (!isSelectable && link) {
      return (
        <Link className="flex w-full items-center gap-x-2" href={link}>
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
        selectType={selectType}>
        {renderContent()}
      </DropdownSubMenuWrapper>
    );
  }

  if (selectType === 'single') {
    return (
      <DropdownMenuCheckboxItemSingle
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        index={showIndex ? index : undefined}
        closeOnSelect={closeOnSelect}>
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
        closeOnSelect={closeOnSelect}>
        {renderContent()}
      </DropdownMenuCheckboxItemMultiple>
    );
  }

  return (
    <DropdownMenuItem
      truncate={truncate}
      disabled={disabled}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}>
      {renderContent()}
    </DropdownMenuItem>
  );
};

interface DropdownSubMenuWrapperProps<T> {
  items: DropdownItems<T> | undefined;
  children: React.ReactNode;
  closeOnSelect: boolean;
  showIndex: boolean;
  onSelect?: (value: T) => void;
  onSelectItem: (index: number) => void;
  selectType: DropdownProps<T>['selectType'];
}

const DropdownSubMenuWrapper = <T,>({
  items,
  children,
  closeOnSelect,
  onSelect,
  onSelectItem,
  selectType,
  showIndex
}: DropdownSubMenuWrapperProps<T>) => {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{children}</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {items?.map((item, index) => (
            <DropdownItemSelector
              key={dropdownItemKey(item, index)}
              item={item}
              index={index}
              onSelect={onSelect}
              onSelectItem={onSelectItem}
              closeOnSelect={closeOnSelect}
              selectType={selectType}
              showIndex={showIndex}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const DropdownMenuHeaderSelector = <T,>({
  menuHeader,
  onChange,
  onSelectItem,
  text,
  showIndex
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

interface DropdownMenuHeaderSearchProps<T> {
  text: string;
  onChange: (text: string) => void;
  onSelectItem: (index: number) => void;
  placeholder?: string;
  showIndex: boolean;
}

const DropdownMenuHeaderSearch = <T,>({
  text,
  onChange,
  onSelectItem,
  showIndex,
  placeholder
}: DropdownMenuHeaderSearchProps<T>) => {
  const onChangePreflight = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(e.target.value);
  });

  const onKeyDownPreflight = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
    const isFirstCharacter = (e.target as HTMLInputElement).value.length === 0;

    // Only prevent default for digit shortcuts when showIndex is true
    if (showIndex && isFirstCharacter && /^Digit[0-9]$/.test(e.code)) {
      e.preventDefault();
      const index = parseInt(e.key);
      onSelectItem?.(index);
    } else {
      e.stopPropagation();
    }
  });

  return (
    <div className="flex items-center gap-x-2">
      <Input
        autoFocus
        variant={'ghost'}
        placeholder={placeholder}
        value={text}
        onChange={onChangePreflight}
        onKeyDown={onKeyDownPreflight}
      />
    </div>
  );
};

DropdownMenuHeaderSearch.displayName = 'DropdownMenuHeaderSearch';
