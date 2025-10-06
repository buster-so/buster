import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/classMerge';

export const inputVariants = cva(
  'flex w-full rounded border px-2.5 text-base transition-all !transition-[height:none] duration-200  disabled:cursor-not-allowed  disabled:text-gray-light ',
  {
    variants: {
      variant: {
        default:
          'shadow disabled:bg-item-select bg-background border placeholder:text-gray-light hover:border-gray-light  outline-none disabled:border-border',
        ghost: 'border-none bg-transparent shadow-none disabled:bg-transparent outline-none',
      },
      size: {
        default: 'h-7',
        tall: 'h-8',
        small: 'h-6',
      },
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>,
    VariantProps<typeof inputVariants> {
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  prefix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'default',
      variant = 'default',
      type = 'text',
      onPressEnter,
      onKeyDown,
      prefix,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onPressEnter) {
        onPressEnter(e);
      }
      onKeyDown?.(e);
    };

    if (prefix) {
      return (
        <div className={cn('relative flex items-center', className)}>
          <span className="pointer-events-none absolute left-2.5 flex items-center text-foreground">
            {prefix}
          </span>
          <input
            type={type}
            className={cn(inputVariants({ size, variant }), 'pl-6.5')}
            ref={ref}
            onKeyDown={handleKeyDown}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant }), className)}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
