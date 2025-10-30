import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import * as React from 'react';
import { CaretRight } from '@/components/ui/icons/NucleoIconFilled';
import { cn } from '@/lib/utils';
import {
  contextMenuContentClass,
  menuCheckboxMultipleClass,
  menuCheckboxSingleClass,
  menuItemClass,
  menuLabelClass,
  menuRadioClass,
  menuSeparatorClass,
  menuSubTriggerCaretClass,
  menuSubTriggerClass,
  shortcutClass,
} from '../menu-shared';
import {
  MenuCheckIndicatorMultiple,
  MenuCheckIndicatorSingle,
  MenuRadioIndicator,
} from '../menu-shared/menu-indicators';

const ContextMenuRoot = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(menuSubTriggerClass, inset && 'pl-8', className)}
    {...props}
  >
    {children}
    <div className={menuSubTriggerCaretClass}>
      <CaretRight />
    </div>
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(contextMenuContentClass, 'shadow-lg', className)}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(contextMenuContentClass, 'shadow', className)}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
    truncate?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, inset, truncate, icon, children, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(menuItemClass, inset && 'pl-8', truncate && 'overflow-hidden', className)}
    {...props}
  >
    {icon && <span className="text-icon-color">{icon}</span>}
    {children}
  </ContextMenuPrimitive.Item>
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & {
    truncate?: boolean;
    closeOnSelect?: boolean;
    selectType?: boolean;
    index?: number;
  }
>(
  (
    {
      className,
      children,
      onClick,
      checked,
      truncate,
      closeOnSelect = true,
      selectType,
      index,
      ...props
    },
    ref
  ) => (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(menuCheckboxSingleClass, truncate && 'overflow-hidden', className)}
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
      <MenuCheckIndicatorSingle ItemIndicator={ContextMenuPrimitive.ItemIndicator} index={index} />
    </ContextMenuPrimitive.CheckboxItem>
  )
);
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuCheckboxItemMultiple = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & {
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
      <ContextMenuPrimitive.CheckboxItem
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
      </ContextMenuPrimitive.CheckboxItem>
    );
  }
);
ContextMenuCheckboxItemMultiple.displayName = 'ContextMenuCheckboxItemMultiple';

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem ref={ref} className={cn(menuRadioClass, className)} {...props}>
    <MenuRadioIndicator ItemIndicator={ContextMenuPrimitive.ItemIndicator} />
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(menuLabelClass, inset && 'pl-8', className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn(menuSeparatorClass, className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn(shortcutClass, className)} {...props} />;
};
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

/**
 * @deprecated Use MenuLink from menu-shared instead
 * This re-export is kept for backward compatibility
 */
export { MenuLink as ContextMenuLink } from '../menu-shared/MenuLink';

export {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuCheckboxItemMultiple,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
