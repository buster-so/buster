'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import React, { useLayoutEffect } from 'react';
import { cn } from '@/lib/classMerge';
import { Input } from '../inputs/Input';

const editableTitleVariants = cva('relative flex items-center justify-between', {
  variants: {
    level: {
      1: 'text-3xl',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-md',
      5: 'text-base'
    }
  },
  defaultVariants: {
    level: 4
  }
});

export const EditableTitle = React.forwardRef<
  HTMLInputElement,
  {
    children: string;
    onEdit?: (b: boolean) => void;
    onChange: (value: string) => void;
    onSetValue?: (value: string) => void;
    onPressEnter?: () => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    style?: React.CSSProperties;
    inputClassName?: string;
    id?: string;
    readOnly?: boolean;
  } & VariantProps<typeof editableTitleVariants>
>(
  (
    {
      id,
      readOnly,
      style,
      disabled,
      className = '',
      inputClassName = '',
      placeholder,
      onPressEnter,
      children,
      level = 4,
      onEdit,
      onChange,
      onSetValue
    },
    inputRef
  ) => {
    const [value, setValue] = React.useState(children);

    useLayoutEffect(() => {
      setValue(children);
    }, [children]);

    return (
      <div className={cn('relative flex items-center justify-between', className)} style={style}>
        <Input
          placeholder={placeholder}
          ref={inputRef}
          id={id}
          disabled={disabled}
          readOnly={readOnly}
          variant="ghost"
          className={cn(
            'w-full cursor-text! rounded-none! px-0! py-0! leading-1',
            editableTitleVariants({ level }),
            inputClassName
          )}
          value={value}
          onChange={(e) => {
            if (e.target.value !== value) setValue(e.target.value);
            onSetValue?.(e.target.value);
          }}
          onBlur={() => {
            onChange(value);
            onEdit?.(false);
          }}
          onFocus={() => {
            onEdit?.(true);
          }}
          onPressEnter={() => {
            onChange(value);
            onPressEnter?.();
          }}
        />
        <div className="from-page-background pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l to-transparent" />
      </div>
    );
  }
);

EditableTitle.displayName = 'EditableTitle';
