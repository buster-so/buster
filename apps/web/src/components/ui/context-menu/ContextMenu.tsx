import React from 'react';
import { cn } from '@/lib/classMerge';
import CircleSpinnerLoader from '../loaders/CircleSpinnerLoader';
import { menuItemKey } from '../menu-shared';
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem as ContextMenuItemPrimitive,
  ContextMenuLink,
  ContextMenuPortal,
  ContextMenuRoot,
  //   ContextMenuLabel,
  //   ContextMenuRadioGroup,
  //   ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextBase';
import type {
  ContextMenuDivider,
  ContextMenuItem,
  ContextMenuItems,
  ContextMenuProps,
} from './contextMenu.types';

export const ContextMenu: React.FC<ContextMenuProps> = React.memo(
  ({ items, className, disabled, children, dir, modal }) => {
    return (
      <ContextMenuRoot dir={dir} modal={modal}>
        <ContextMenuTrigger disabled={disabled} asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className={cn('max-w-72 min-w-44', className)}>
          {items.map((item, index) => (
            <React.Fragment key={menuItemKey(item, index)}>
              <ContextMenuItemSelector item={item} index={index} />
            </React.Fragment>
          ))}
        </ContextMenuContent>
      </ContextMenuRoot>
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
  index,
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
        checked={selected}
      >
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
              <React.Fragment key={menuItemKey(item, index)}>
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
