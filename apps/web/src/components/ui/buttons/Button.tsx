import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';

export const buttonTypeClasses = {
  default:
    'bg-background border hover:bg-item-hover disabled:bg-disabled disabled:text-gray-light active:bg-item-active data-[selected=true]:bg-item-select',
  black:
    'bg-black text-white hover:bg-foreground-hover disabled:bg-background disabled:text-gray-light disabled:ring-[0.5px] ring-border ',
  outlined:
    'bg-transparent border border-border text-gray-dark hover:bg-item-hover disabled:bg-transparent disabled:text-gray-light active:bg-item-active data-[selected=true]:bg-item-select',
  primary:
    'bg-primary disabled:bg-disabled text-white hover:bg-primary-light disabled:text-gray-light active:bg-primary-dark data-[selected=true]:bg-primary-dark',
  ghost:
    'bg-transparent text-gray-dark shadow-none hover:bg-item-hover hover:text-foreground disabled:bg-transparent disabled:text-gray-light active:bg-item-active data-[selected=true]:bg-item-select',
  link: 'bg-transparent text-gray-dark shadow-none hover:text-foreground disabled:bg-transparent disabled:text-gray-light',
  danger:
    'bg-danger-background text-danger-foreground hover:bg-danger-background-hover active:bg-danger-background-hover data-[selected=true]:bg-danger-background-hover',
  warning:
    'bg-warning-background text-warning-foreground hover:bg-warning-background-hover active:bg-warning-background-hover data-[selected=true]:bg-warning-background-hover',
  success:
    'bg-success-background text-success-foreground hover:bg-success-background-hover active:bg-success-background-hover data-[selected=true]:bg-success-background-hover',
};

const roundingVariants = {
  default: 'rounded',
  full: 'rounded-full',
  large: 'rounded-lg',
  small: 'rounded-sm',
  none: 'rounded-none',
};

const sizeVariants = {
  default: 'h-6 min-h-6 max-h-6',
  tall: 'h-7 min-h-7 max-h-7',
  small: 'h-5 min-h-5 max-h-5',
};

export const buttonVariants = cva(
  'inline-flex cursor-pointer whitespace-nowrap items-center overflow-hidden text-base justify-center gap-1.5 shadow rounded transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed data-[loading=true]:cursor-progress',
  {
    variants: {
      variant: buttonTypeClasses,
      size: sizeVariants,
      iconButton: {
        true: '',
        false: 'px-2.5',
      },
      rounding: roundingVariants,
      block: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      {
        iconButton: true,
        size: 'default',
        className: 'w-6 min-w-6 max-w-6',
      },
      {
        iconButton: true,
        size: 'tall',
        className: 'w-7 min-w-7 max-w-7',
      },
      {
        iconButton: true,
        size: 'small',
        className: 'w-5 min-w-5 max-w-5 px-1.5',
      },
      {
        iconButton: false,
        size: 'small',
        className: 'px-1.5',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      iconButton: false,
      block: false,
    },
  }
);

export const buttonIconVariants = cva('button-icon', {
  variants: {
    variant: {
      default: 'text-icon-color',
      black: 'text-white!',
      outlined: 'text-icon-color',
      primary: 'text-white',
      ghost: 'text-icon-color',
      link: 'text-icon-color',
      danger: 'text-danger-foreground',
      warning: 'text-warning-foreground',
      success: 'text-success-foreground',
    },
    size: {
      default: 'text-icon-size!',
      tall: 'text-icon-size-lg!',
      small: 'text-icon-size-sm!',
    },
    disabled: {
      true: 'text-gray-light',
      false: '',
    },
  },
  compoundVariants: [
    {
      variant: 'black',
      disabled: true,
      className: 'text-gray-light',
    },
    {
      variant: 'outlined',
      size: 'tall',
      className: 'text-icon-size!',
    },
  ],
});

const loadingSizeVariants = {
  default: 'w-[var(--text-icon-size)] h-[var(--text-icon-size)]',
  tall: 'w-[var(--text-icon-size-lg)] h-[var(--text-icon-size-lg)]',
  small: 'w-[var(--text-icon-size-sm)] h-[var(--text-icon-size-sm)]',
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  loading?: boolean;
  selected?: boolean;
  prefixClassName?: string;
  suffixClassName?: string;
  block?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      asChild = false,
      prefix,
      suffix,
      children,
      loading = false,
      selected = false,
      disabled = false,
      prefixClassName,
      suffixClassName,
      rounding = 'default',
      block = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const hasChildren = !!children;
    const iconButton = !hasChildren && (!prefix || !suffix);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, iconButton, rounding, block, className }))}
        onClick={onClick}
        ref={ref}
        disabled={disabled}
        data-loading={loading}
        data-selected={selected}
        {...props}
      >
        {loading ? (
          <LoadingIcon variant={variant} size={size} />
        ) : (
          prefix && (
            <span className={cn(buttonIconVariants({ disabled, variant, size }), prefixClassName)}>
              {prefix}
            </span>
          )
        )}
        {hasChildren && <span className="">{children}</span>}
        {suffix && (
          <span className={cn(buttonIconVariants({ disabled, variant, size }), suffixClassName)}>
            {suffix}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export const LoadingIcon: React.FC<{
  variant: ButtonProps['variant'];
  size: ButtonProps['size'];
}> = ({ variant = 'default', size = 'default' }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-black dark:text-white',
        variant === 'black' && 'dark',
        loadingSizeVariants[size || 'default']
      )}
    >
      <CircleSpinnerLoader
        size={size === 'tall' ? 12.5 : 9.5}
        fill={
          variant === 'black'
            ? 'var(--color-white)'
            : variant === 'primary'
              ? 'var(--color-primary)'
              : 'var(--color-primary)'
        }
      />
    </div>
  );
};
