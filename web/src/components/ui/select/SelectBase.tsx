'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/classMerge';
import { Check3 as Check, ChevronDown, ChevronUp } from '../icons/NucleoIconOutlined';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

export const selectVariants = cva(
  'flex w-full gap-x-1.5 transition-colors transition-border text-foreground duration-200 items-center justify-between rounded border px-3 py-1 text-sm focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 [&>span]:line-clamp-1 [&>span]:text-left',
  {
    variants: {
      variant: {
        default: 'border-border shadow bg-background  data-[placeholder]:text-gray-light  ',
        ghost: 'border-none bg-transparent shadow-none disabled:bg-transparent outline-none'
      },
      size: {
        default: 'h-7',
        tall: 'h-8',
        small: 'h-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
    VariantProps<typeof selectVariants>
>(({ className, variant = 'default', size = 'default', children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(selectVariants({ variant, size }), className)}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <div className="flex items-center justify-center opacity-50">
        <ChevronDown />
      </div>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}>
    <div className="flex items-center justify-center">
      <ChevronUp />
    </div>
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}>
    <div className="flex items-center justify-center">
      <ChevronDown />
    </div>
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'bg-background text-foreground',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'rounded border shadow',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}>
      {/* <SelectScrollUpButton /> */}
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}>
        {children}
      </SelectPrimitive.Viewport>
      {/* <SelectScrollDownButton /> */}
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pr-2 pl-6.5 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    secondaryChildren?: React.ReactNode;
    index?: number;
    icon?: React.ReactNode;
  }
>(({ className, children, icon, secondaryChildren, index, ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'data-[highlighted]:bg-item-hover focus:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
        'data-[state=checked]:bg-item-select! relative flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-60',
        className
      )}
      {...props}>
      <div className="flex flex-col gap-y-0.5">
        <div className="flex items-center gap-x-1.5">
          {icon && <span className="text-icon-color">{icon}</span>}
          <SelectPrimitive.ItemText className="flex h-full items-center">
            {children}
          </SelectPrimitive.ItemText>
        </div>
        {secondaryChildren && <span className="text-gray-light text-xs">{secondaryChildren}</span>}
      </div>

      <div className="flex items-center gap-x-1">
        <SelectPrimitive.ItemIndicator>
          <Check />
        </SelectPrimitive.ItemIndicator>
        {index !== undefined && (
          <span className="text-gray-light flex min-w-2 items-center justify-center text-xs">
            {index}
          </span>
        )}
      </div>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Define a type for SelectItem
export type SelectItemType<T = string> = {
  value: T;
  label: string | React.ReactNode;
  secondaryLabel?: string;
  icon?: React.ReactNode;
  searchLabel?: string;
  disabled?: boolean;
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
};
