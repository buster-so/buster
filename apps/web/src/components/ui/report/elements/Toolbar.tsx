'use client';

import * as React from 'react';

import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown } from '@/components/ui/icons';

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ToolbarPrimitive.Root>
>(function Toolbar({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.Root
      ref={ref}
      className={cn('relative flex items-center select-none', className)}
      {...props}
    />
  );
});

Toolbar.displayName = 'Toolbar';

export const ToolbarToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToolbarToggleGroup>,
  React.ComponentProps<typeof ToolbarPrimitive.ToolbarToggleGroup>
>(function ToolbarToggleGroup({ className, ...props }, ref) {
  return (
    <ToolbarPrimitive.ToolbarToggleGroup
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    />
  );
});

export function ToolbarLink({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Link>) {
  return (
    <ToolbarPrimitive.Link
      className={cn('font-medium underline underline-offset-4', className)}
      {...props}
    />
  );
}

export function ToolbarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ToolbarPrimitive.Separator>) {
  return (
    <ToolbarPrimitive.Separator
      className={cn('bg-border mx-2 my-1 w-px shrink-0', className)}
      {...props}
    />
  );
}

// From toggleVariants
const toolbarButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent aria-checked:text-accent-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: 'default',
      variant: 'default'
    },
    variants: {
      size: {
        default: 'h-9 min-w-9 px-2',
        lg: 'h-10 min-w-10 px-2.5',
        sm: 'h-8 min-w-8 px-1.5'
      },
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground'
      }
    }
  }
);

const dropdownArrowVariants = cva(
  cn(
    'inline-flex items-center justify-center rounded-r-md text-sm font-medium text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50'
  ),
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default'
    },
    variants: {
      size: {
        default: 'h-9 w-6',
        lg: 'h-10 w-8',
        sm: 'h-8 w-4'
      },
      variant: {
        default:
          'bg-transparent hover:bg-muted hover:text-muted-foreground aria-checked:bg-accent aria-checked:text-accent-foreground',
        outline:
          'border border-l-0 border-input bg-transparent hover:bg-accent hover:text-accent-foreground'
      }
    }
  }
);

type ToolbarButtonProps = {
  isDropdown?: boolean;
  pressed?: boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>, 'asChild' | 'value'> &
  VariantProps<typeof toolbarButtonVariants>;

export const ToolbarButton = withTooltip(
  React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
    { children, className, isDropdown, pressed, size = 'sm', variant, ...props },
    ref
  ) {
    return typeof pressed === 'boolean' ? (
      <ToolbarToggleGroup disabled={props.disabled} value="single" type="single">
        <ToolbarToggleItem
          ref={ref}
          className={cn(
            toolbarButtonVariants({
              size,
              variant
            }),
            isDropdown && 'justify-between gap-1 pr-1',
            className
          )}
          value={pressed ? 'single' : ''}
          {...props}>
          {isDropdown ? (
            <>
              <div className="flex flex-1 items-center gap-2 whitespace-nowrap">{children}</div>
              <div className="text-muted-foreground size-3.5" data-icon>
                <ChevronDown />
              </div>
            </>
          ) : (
            children
          )}
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
    ) : (
      <ToolbarPrimitive.Button
        ref={ref}
        className={cn(
          toolbarButtonVariants({
            size,
            variant
          }),
          isDropdown && 'pr-1',
          className
        )}
        {...props}>
        {children}
      </ToolbarPrimitive.Button>
    );
  })
);

export function ToolbarSplitButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToolbarButton>) {
  return (
    <ToolbarButton
      className={cn('group flex gap-0 px-0 hover:bg-transparent', className)}
      {...props}
    />
  );
}

type ToolbarSplitButtonPrimaryProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
  'value'
> &
  VariantProps<typeof toolbarButtonVariants>;

export function ToolbarSplitButtonPrimary({
  children,
  className,
  size = 'sm',
  variant,
  ...props
}: ToolbarSplitButtonPrimaryProps) {
  return (
    <span
      className={cn(
        toolbarButtonVariants({
          size,
          variant
        }),
        'rounded-r-none',
        'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
        className
      )}
      {...props}>
      {children}
    </span>
  );
}

export function ToolbarSplitButtonSecondary({
  className,
  size,
  variant,
  ...props
}: React.ComponentPropsWithoutRef<'span'> & VariantProps<typeof dropdownArrowVariants>) {
  return (
    <span
      className={cn(
        dropdownArrowVariants({
          size,
          variant
        }),
        'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      role="button"
      {...props}>
      <div className="text-muted-foreground size-3.5" data-icon>
        <ChevronDown />
      </div>
    </span>
  );
}

export const ToolbarToggleItem = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleItem>,
  React.ComponentProps<typeof ToolbarPrimitive.ToggleItem> &
    VariantProps<typeof toolbarButtonVariants>
>(function ToolbarToggleItem({ className, size = 'sm', variant, ...props }, ref) {
  return (
    <ToolbarPrimitive.ToggleItem
      ref={ref}
      className={cn(toolbarButtonVariants({ size, variant }), className)}
      {...props}
    />
  );
});

export function ToolbarGroup({ children, className }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('group/toolbar-group', 'relative hidden has-[button]:flex', className)}>
      <div className="flex items-center">{children}</div>

      <div className="mx-1.5 py-0.5 group-last/toolbar-group:hidden!">
        <Separator orientation="vertical" />
      </div>
    </div>
  );
}

type TooltipProps<T extends React.ElementType> = {
  tooltip?: React.ReactNode;
} & React.ComponentProps<T>;

function withTooltip<T extends React.ElementType>(Component: T) {
  const ExtendComponent = React.forwardRef<HTMLElement, TooltipProps<T>>(
    ({ tooltip, tooltipContentProps, tooltipProps, tooltipTriggerProps, ...props }, ref) => {
      const [mounted, setMounted] = React.useState(false);

      React.useEffect(() => {
        setMounted(true);
      }, []);

      const componentProps = {
        ...props,
        ref
      };

      const component = React.createElement(Component, componentProps);

      if (tooltip && mounted) {
        return <Tooltip title={tooltip}>{component}</Tooltip>;
      }

      return component;
    }
  );

  ExtendComponent.displayName = `withTooltip`;

  return ExtendComponent;
}

export function ToolbarMenuGroup({
  children,
  className,
  label,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioGroup> & { label?: string }) {
  return (
    <>
      <DropdownMenuSeparator
        className={cn(
          'hidden',
          'mb-0 shrink-0 peer-has-[[role=menuitem]]/menu-group:block peer-has-[[role=menuitemradio]]/menu-group:block peer-has-[[role=option]]/menu-group:block'
        )}
      />

      <DropdownMenuRadioGroup
        {...props}
        className={cn(
          'hidden',
          'peer/menu-group group/menu-group my-1.5 has-[[role=menuitem]]:block has-[[role=menuitemradio]]:block has-[[role=option]]:block',
          className
        )}>
        {label && (
          <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold select-none">
            {label}
          </DropdownMenuLabel>
        )}
        {children}
      </DropdownMenuRadioGroup>
    </>
  );
}
