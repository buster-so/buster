import React from 'react';
import {
  ContextMenu as ContextMenuPrimitive,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem as ContextMenuItemPrimitive,
  //   ContextMenuLabel,
  //   ContextMenuRadioGroup,
  //   ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuLink,
  ContextMenuPortal
} from './ContextBase';
import type { ContextMenuProps as ContextMenuPropsRadix } from '@radix-ui/react-context-menu';
import CircleSpinnerLoader from '../loaders/CircleSpinnerLoader';
import { cn } from '@/lib/classMerge';

export interface ContextMenuItem {
  label: React.ReactNode | string;
  truncate?: boolean;
  secondaryLabel?: string;
  showIndex?: boolean;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean; //if a boolean is provided, it will render a checkboxitem component
  items?: ContextMenuItems;
  link?: string;
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right';
}

export interface ContextMenuDivider {
  type: 'divider';
}

export type ContextMenuItems = (ContextMenuItem | ContextMenuDivider | React.ReactNode)[];

export interface ContextMenuProps extends ContextMenuPropsRadix {
  items: ContextMenuItems;
  className?: string;
  disabled?: boolean;
}

const contextMenuItemKey = (item: ContextMenuItems[number], index: number) => {
  if ((item as ContextMenuDivider).type === 'divider') return `divider-${index}`;
  return `item-${index}`;
};

export const ContextMenu: React.FC<ContextMenuProps> = React.memo(
  ({ items, className, disabled, children, dir, modal }) => {
    return (
      <ContextMenuPrimitive dir={dir} modal={modal}>
        <ContextMenuTrigger disabled={disabled} asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className={cn('max-w-72 min-w-44', className)}>
          {items.map((item, index) => (
            <React.Fragment key={contextMenuItemKey(item, index)}>
              <ContextMenuItemSelector item={item} index={index} />
            </React.Fragment>
          ))}
        </ContextMenuContent>
      </ContextMenuPrimitive>
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

const ContextMenuItemSelector: React.FC<{
  item: ContextMenuItems[number];
  index: number;
}> = React.memo(({ item, index }) => {
  if ((item as ContextMenuDivider).type === 'divider') {
    return <ContextMenuSeparator />;
  }

  if (typeof item === 'object' && React.isValidElement(item)) {
    return item;
  }

  return <ContextMenuItemComponent {...(item as ContextMenuItem)} index={index} />;
});

ContextMenuItemSelector.displayName = 'ContextMenuItemSelector';

const ContextMenuItemComponent: React.FC<ContextMenuItem & { index: number }> = ({
  label,
  showIndex,
  shortcut,
  onClick,
  items,
  icon,
  disabled,
  loading,
  selected,
  secondaryLabel,
  truncate,
  link,
  linkIcon,
  index
}) => {
  const isSubItem = items && items.length > 0;

  const content = (
    <>
      {showIndex && <span className="text-gray-light">{index}</span>}
      {icon && !loading && <span className="text-icon-color">{icon}</span>}
      {icon && loading && <CircleSpinnerLoader size={9} />}
      <div className={cn('flex flex-col gap-y-1', truncate && 'overflow-hidden')}>
        <span className={cn(truncate && 'truncate', 'flex items-center gap-x-1')}>
          {label}
          {!icon && loading && <CircleSpinnerLoader size={9} />}
        </span>
        {secondaryLabel && <span className="text-gray-light text2xs">{secondaryLabel}</span>}
      </div>
      {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
      {link && (
        <ContextMenuLink className="-mr-1 ml-auto opacity-100" link={link} linkIcon={linkIcon} />
      )}
    </>
  );

  if (isSubItem) {
    return <ContextSubMenuWrapper items={items}>{content}</ContextSubMenuWrapper>;
  }

  const isSelectable = typeof selected === 'boolean';

  if (isSelectable) {
    return (
      <ContextMenuCheckboxItem
        truncate={truncate}
        disabled={disabled}
        onClick={onClick}
        checked={selected}>
        {content}
      </ContextMenuCheckboxItem>
    );
  }

  return (
    <ContextMenuItemPrimitive truncate={truncate} disabled={disabled} onClick={onClick}>
      {content}
    </ContextMenuItemPrimitive>
  );
};

const ContextSubMenuWrapper = React.memo(
  ({ items, children }: { items: ContextMenuItems | undefined; children: React.ReactNode }) => {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger>{children}</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent>
            {items?.map((item, index) => (
              <React.Fragment key={contextMenuItemKey(item, index)}>
                <ContextMenuItemSelector item={item} index={index} />
              </React.Fragment>
            ))}
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
    );
  }
);
ContextSubMenuWrapper.displayName = 'ContextSubMenuWrapper';
