'use client';

import { cn } from '@/lib/classMerge';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '../buttons/Button';
import { Checkbox } from '../checkbox/Checkbox';
import { CaretRight } from '../icons/NucleoIconFilled';
import { ArrowRight, ArrowUpRight, Check3 as Check } from '../icons/NucleoIconOutlined';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'focus:bg-item-hover data-[state=open]:bg-item-hover flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
      'dropdown-item mx-1 [&.dropdown-item:first-child]:mt-1! [&.dropdown-item:has(+.dropdown-separator)]:mb-1 [&.dropdown-item:has(~.dropdown-separator)]:mt-1 [&.dropdown-item:last-child]:mb-1!',
      inset && 'pl-8',
      className
    )}
    {...props}>
    {children}
    <div className="text-2xs text-icon-color ml-auto">
      <CaretRight />
    </div>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const baseContentClass = cn(
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden',
  'bg-background text-foreground ',
  'rounded-md border min-w-48'
);

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(baseContentClass, 'shadow-lg', className)}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, children, sideOffset = 4, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(baseContentClass, 'p-0 shadow', className)}
        {...props}>
        <div className="used-for-ref-purpose">{children}</div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    closeOnSelect?: boolean;
    selectType?: string;
    truncate?: boolean;
  }
>(({ className, closeOnSelect = true, onClick, inset, selectType, truncate, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
      'focus:bg-item-select focus:text-foreground',
      'dropdown-item mx-1 [&.dropdown-item:first-child]:mt-1! [&.dropdown-item:has(+.dropdown-separator)]:mb-1 [&.dropdown-item:has(~.dropdown-separator)]:mt-1 [&.dropdown-item:last-child]:mb-1!',
      inset && 'pl-8',
      truncate && 'overflow-hidden',
      'group',
      className
    )}
    onClick={(e) => {
      if (!closeOnSelect) {
        e.stopPropagation();
        e.preventDefault();
      }
      onClick?.(e);
    }}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const itemClass = cn(
  'focus:bg-item-hover focus:text-foreground',
  'relative flex cursor-pointer items-center rounded-sm py-1.5 text-base outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  'gap-1.5',
  'mx-1 dropdown-item [&.dropdown-item:has(+.dropdown-separator)]:mb-1 [&.dropdown-item:has(~.dropdown-separator)]:mt-1 [&.dropdown-item:first-child]:mt-1! [&.dropdown-item:last-child]:mb-1!'
);

const DropdownMenuCheckboxItemSingle = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
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
      className={cn(itemClass, 'data-[state=checked]:bg-item-select', 'pr-6 pl-2', className)}
      checked={checked}
      onClick={(e) => {
        if (closeOnSelect) {
          e.stopPropagation();
          e.preventDefault();
        }
        onClick?.(e);
      }}
      {...props}>
      {children}
      <span className="absolute right-2 flex h-3.5 w-fit items-center justify-center space-x-1">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="text-icon-color flex items-center justify-center text-sm">
            <Check />
          </div>
        </DropdownMenuPrimitive.ItemIndicator>
        {index !== undefined && (
          <span className="text-gray-dark ml-auto w-2 text-center">{index}</span>
        )}
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  )
);
DropdownMenuCheckboxItemSingle.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuCheckboxItemMultiple = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
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
    console.log('dataTestId', dataTestId);
    return (
      <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(itemClass, 'group pr-2 pl-7', className)}
        checked={checked}
        onClick={(e) => {
          if (closeOnSelect) {
            e.stopPropagation();
            e.preventDefault();
          }
          onClick?.(e);
        }}
        data-testid={dataTestId}
        {...props}>
        <span
          className={cn(
            'absolute left-2 flex h-3.5 w-3.5 items-center justify-center opacity-0 group-hover:opacity-100',
            checked && 'opacity-100'
          )}>
          <Checkbox size="sm" checked={checked} />
        </span>
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    );
  }
);
DropdownMenuCheckboxItemMultiple.displayName = 'DropdownMenuCheckboxItemMultiple';

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('text-gray-dark px-2 py-1.5 text-base', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(
      'bg-border dropdown-separator -mx-1 my-1 h-[0.5px]',
      '[&.dropdown-separator:first-child]:hidden [&.dropdown-separator:has(+.dropdown-separator)]:hidden [&.dropdown-separator:last-child]:hidden',
      className
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

const DropdownMenuLink: React.FC<{
  className?: string;
  link: string | null;
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right';
  linkTarget?: '_blank' | '_self';
}> = ({ className, link, linkTarget, linkIcon = 'arrow-right', ...props }) => {
  const icon = React.useMemo(() => {
    if (linkIcon === 'arrow-right') return <ArrowRight />;
    if (linkIcon === 'arrow-external') return <ArrowUpRight />;
    if (linkIcon === 'caret-right') return <CaretRight />;
  }, [linkIcon]);

  const isExternal = link?.startsWith('http');

  const content = (
    <Button
      prefix={icon}
      variant="ghost"
      size="small"
      rounding={'default'}
      className={cn('text-gray-dark hover:bg-gray-dark/8')}
    />
  );

  if (!link)
    return (
      <div
        className={className}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}>
        {content}
      </div>
    );

  return (
    <span
      className={className}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
      <Link href={link} target={linkTarget || isExternal ? '_blank' : '_self'} className="">
        {content}
      </Link>
    </span>
  );
};
DropdownMenuLink.displayName = 'DropdownMenuLink';

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
  DropdownMenuLink
};
