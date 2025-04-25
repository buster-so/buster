'use client';

import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { PopoverRoot, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/inputs';
import { useDebounceFn } from '@/hooks';
import { cva } from 'class-variance-authority';

interface ColorPickerProps {
  value: string | null | undefined;
  onChange?: (value: string) => void;
  onChangeComplete?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  size?: 'default' | 'small' | 'tall';
  name?: string;
  className?: string;
}

const colorPickerWrapperVariants = cva('border p-1 rounded cursor-pointer shadow', {
  variants: {
    size: {
      default: 'w-6 min-w-6 max-w-6 h-6 min-h-6 max-h-6',
      small: 'w-5 min-w-5 max-w-5 h-5 min-h-5 max-h-5',
      tall: 'w-7 min-w-7 max-w-7 h-7 min-h-7 max-h-7'
    },
    disabled: {
      true: 'cursor-not-allowed opacity-60',
      false: 'cursor-pointer'
    }
  }
});

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      disabled,
      onChangeComplete,
      size = 'default',
      value: valueProp = '#000000',
      onChange,
      name,
      className = '',
      ...props
    },
    forwardedRef
  ) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(valueProp);

    const parsedValue = useMemo(() => {
      return value || '#000000';
    }, [value]);

    const { run: debouncedOnChangeComplete } = useDebounceFn(
      (value: string) => {
        onChangeComplete?.(value);
      },
      { wait: 150 }
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e?.currentTarget?.value);
        onChange?.(e?.currentTarget?.value);
        debouncedOnChangeComplete?.(e?.currentTarget?.value);
      },
      [onChange, debouncedOnChangeComplete]
    );

    const handleHexColorPickerChange = useCallback(
      (color: string) => {
        setValue(color);
        onChange?.(color);
        debouncedOnChangeComplete?.(color);
      },
      [onChange, debouncedOnChangeComplete]
    );
    return (
      <PopoverRoot onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled}>
          <div className={colorPickerWrapperVariants({ size, disabled })}>
            <div className="h-full w-full rounded-sm" style={{ backgroundColor: parsedValue }} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full" align="end" side="bottom">
          <HexColorPicker color={parsedValue} onChange={handleHexColorPickerChange} />
          <Input
            className="mt-2.5"
            maxLength={7}
            onChange={handleInputChange}
            value={parsedValue}
          />
        </PopoverContent>
      </PopoverRoot>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
