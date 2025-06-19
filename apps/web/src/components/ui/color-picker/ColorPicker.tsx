'use client';

import { cva } from 'class-variance-authority';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/inputs';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/ui/popover';
import { useDebounceFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

interface ColorPickerProps {
  value: string | null | undefined;
  onChange?: (value: string) => void;
  onChangeComplete?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  size?: 'default' | 'small' | 'tall';
  name?: string;
  className?: string;
  children?: React.ReactNode;
  showInput?: boolean;
  showPicker?: boolean;
  pickerBackgroundImage?: string;
}

const colorPickerWrapperVariants = cva('border p-0.5 rounded cursor-pointer shadow', {
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

const ColorPicker = ({
  disabled,
  onChangeComplete,
  size = 'default',
  value: valueProp = '#000000',
  onChange,
  name,
  className = '',
  children,
  showInput = true,
  showPicker = true,
  pickerBackgroundImage,
  ...props
}: ColorPickerProps) => {
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

  useEffect(() => {
    setValue(valueProp);
  }, [valueProp]);

  return (
    <PopoverRoot onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild disabled={disabled}>
        <div>
          <ColorPickerInputBox
            parsedValue={parsedValue}
            size={size}
            disabled={disabled}
            pickerBackgroundImage={pickerBackgroundImage}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full" align="end" side="bottom">
        <div>
          {showPicker && (
            <HexColorPicker color={parsedValue} onChange={handleHexColorPickerChange} />
          )}
          {showInput && (
            <Input
              className="mt-2.5"
              maxLength={7}
              onChange={handleInputChange}
              value={parsedValue}
            />
          )}
          {children && <div className={cn((showInput || showPicker) && 'mt-2.5')}>{children}</div>}
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
};
ColorPicker.displayName = 'ColorPicker';

const ColorPickerInputBox = ({
  parsedValue,
  size,
  disabled,
  pickerBackgroundImage
}: {
  parsedValue: string;
  size: 'default' | 'small' | 'tall';
  disabled: boolean | undefined;
  pickerBackgroundImage: string | undefined;
}) => {
  const backgroundStyle =
    parsedValue === 'inherit' || pickerBackgroundImage
      ? {
          backgroundImage:
            pickerBackgroundImage ||
            'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)'
        }
      : { backgroundColor: parsedValue };

  return (
    <div className={colorPickerWrapperVariants({ size, disabled })}>
      <div className="h-full w-full rounded-sm" style={backgroundStyle} />
    </div>
  );
};

export { ColorPicker };
