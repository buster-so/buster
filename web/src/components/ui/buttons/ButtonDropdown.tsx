'use client';

import React from 'react';
import {
  buttonVariants,
  buttonIconVariants,
  type ButtonProps,
  buttonTypeClasses,
  LoadingIcon
} from './Button';
import { ChevronDown } from '../icons/NucleoIconOutlined';
import { cn } from '@/lib/classMerge';
import { cva } from 'class-variance-authority';
import { type DropdownProps, Dropdown } from '../dropdown/Dropdown';
import { useMemoizedFn } from '@/hooks';

interface ButtonDropdownProps {
  icon?: React.ReactNode;
  buttonText?: string;
  disabled?: boolean;
  rounding?: ButtonProps['rounding'];
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  loading?: boolean;
  className?: string;
  iconClassName?: string;
  dropdownProps: Omit<DropdownProps, 'children'>;
}

const dropdownButtonVariants = cva('flex items-center pr-0', {
  variants: {
    rounding: {
      default: 'rounded',
      full: 'rounded-full',
      large: 'rounded-lg',
      small: 'rounded-sm',
      none: 'rounded-none'
    }
  }
});

const primaryButtonVariants = cva('', {
  variants: {
    variant: buttonTypeClasses
  }
});

const splitButtonVariants = cva('flex w-full items-center justify-center h-full px-[5px]', {
  variants: {
    variant: buttonTypeClasses
  }
});

export const ButtonDropdown = React.forwardRef<HTMLDivElement, ButtonDropdownProps>(
  ({ dropdownProps, ...buttonProps }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <Dropdown
        {...dropdownProps}
        open={isOpen}
        onOpenChange={setIsOpen}
        align={dropdownProps.align || 'end'}>
        <ButtonSplit ref={ref} {...buttonProps} open={isOpen} onOpenChange={setIsOpen} />
      </Dropdown>
    );
  }
);
ButtonDropdown.displayName = 'ButtonDropdown';

export const ButtonSplit = React.memo(
  React.forwardRef<
    HTMLDivElement,
    Omit<ButtonDropdownProps, 'dropdownProps'> & {
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }
  >(
    (
      {
        className,
        variant = 'default',
        size = 'default',
        icon,
        buttonText,
        disabled = false,
        rounding = 'default',
        loading = false,
        iconClassName,
        open,
        onOpenChange
      },
      ref
    ) => {
      const handleClick = useMemoizedFn(() => {
        if (disabled) return;
        onOpenChange(!open);
      });

      return (
        <div
          ref={ref}
          className={cn(
            buttonVariants({ variant, size, rounding: 'none' }),
            dropdownButtonVariants({ rounding }),
            'gap-0 !bg-transparent p-0',
            disabled && 'cursor-not-allowed opacity-70',
            className
          )}>
          <div
            className={cn(
              primaryButtonVariants({ variant }),
              'flex h-full items-center gap-0.5 border-none pr-2 pl-2.5'
            )}>
            {loading ? (
              <LoadingIcon variant={variant} size={size} />
            ) : (
              icon && (
                <span
                  className={cn(buttonIconVariants({ variant, size }), 'text-sm', iconClassName)}>
                  {icon}
                </span>
              )
            )}
            {buttonText && <span className="">{buttonText}</span>}
          </div>
          <div className="bg-border mr-0 h-full w-[0.5px]" />
          <div className="flex h-full items-center justify-center text-sm" onClick={handleClick}>
            <div
              className={cn(splitButtonVariants({ variant }), 'border-none')}
              aria-label="Open dropdown menu">
              <span
                className={cn(
                  'transition-transform duration-100',
                  disabled && 'cursor-not-allowed opacity-90',
                  open && 'rotate-180'
                )}>
                <ChevronDown />
              </span>
            </div>
          </div>
        </div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.className === nextProps.className &&
      prevProps.variant === nextProps.variant &&
      prevProps.size === nextProps.size &&
      prevProps.icon === nextProps.icon &&
      prevProps.buttonText === nextProps.buttonText &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.rounding === nextProps.rounding &&
      prevProps.loading === nextProps.loading &&
      prevProps.iconClassName === nextProps.iconClassName &&
      prevProps.open === nextProps.open &&
      prevProps.onOpenChange === nextProps.onOpenChange
    );
  }
);

ButtonSplit.displayName = 'ButtonSplit';
