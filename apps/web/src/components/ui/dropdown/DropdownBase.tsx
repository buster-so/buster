import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as React from 'react';
import { cn } from '@/lib/classMerge';
import { CaretRight } from '../icons/NucleoIconFilled';
import {
  dropdownContentClass,
  menuCheckboxMultipleClass,
  menuCheckboxSingleClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  menuSubTriggerCaretClass,
  menuSubTriggerClass,
  shortcutClass,
} from '../menu-shared';
import {
  MenuCheckIndicatorMultiple,
  MenuCheckIndicatorSingle,
} from '../menu-shared/menu-indicators';
import type { IDropdownItem } from './dropdown-items.types';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(menuSubTriggerClass, inset && 'pl-8', className)}
    {...props}
  >
    {children}
    <div className={menuSubTriggerCaretClass}>
      <CaretRight />
    </div>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(dropdownContentClass, 'shadow-lg', className)}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, children, sideOffset = 4, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(dropdownContentClass, 'p-0 shadow', className)}
        {...props}
      >
        <div className="used-for-ref-purpose">{children}</div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    closeOnSelect?: boolean;
    selectType?: string;
    truncate?: boolean;
  }
>(({ className, closeOnSelect = true, onClick, inset, selectType, truncate, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(menuItemClass, inset && 'pl-8', truncate && 'overflow-hidden', className)}
    //some weird bug in a nested menu required this
    onMouseDown={(e) => {
      if (!closeOnSelect) {
        e.stopPropagation();
        e.preventDefault();
      }
      onClick?.(e);
    }}
    onClick={(e) => {
      if (!closeOnSelect) {
        e.stopPropagation();
        e.preventDefault();
      }
    }}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItemSingle = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    closeOnSelect?: boolean;
    selectType?: boolean;
    index?: number;
  }
>(
  (
    { className, children, onClick, checked, closeOnSelect = true, selectType, index, ...props },
    ref
  ) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(menuCheckboxSingleClass, className)}
      checked={checked}
      onClick={(e) => {
        if (closeOnSelect) {
          e.stopPropagation();
          e.preventDefault();
        }
        onClick?.(e);
      }}
      {...props}
    >
      {children}
      <MenuCheckIndicatorSingle ItemIndicator={DropdownMenuPrimitive.ItemIndicator} index={index} />
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItemSingle.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuCheckboxItemMultiple = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    closeOnSelect?: boolean;
    selectType?: boolean;
    dataTestId?: string;
  }
>(
  (
    {
      className,
      children,
      onClick,
      checked = false,
      closeOnSelect = true,
      selectType,
      dataTestId,
      ...props
    },
    ref
  ) => {
    return (
      <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(menuCheckboxMultipleClass, className)}
        checked={checked}
        onClick={(e) => {
          if (closeOnSelect) {
            e.stopPropagation();
            e.preventDefault();
          }
          onClick?.(e);
        }}
        data-testid={dataTestId}
        {...props}
      >
        <MenuCheckIndicatorMultiple checked={checked} />
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    );
  }
);
DropdownMenuCheckboxItemMultiple.displayName = 'DropdownMenuCheckboxItemMultiple';

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(menuLabelClass, inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(menuSeparatorClass, className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn(shortcutClass, className)} {...props} />;
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

/**
 * @deprecated Use MenuLink from menu-shared instead
 * This re-export is kept for backward compatibility
 */
export { MenuLink as DropdownMenuLink } from '../menu-shared/MenuLink';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItemSingle,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItemMultiple,
};
