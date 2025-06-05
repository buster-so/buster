import React from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { Input, type InputProps } from './Input';

export interface InputNumberProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, onChange, min, max, step = 1, className, ...props }, ref) => {
    const handleChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number.parseFloat(e.target.value);

      if (Number.isNaN(newValue)) {
        onChange?.(0);
        return;
      }

      let finalValue = newValue;

      if (min !== undefined && newValue < min) {
        finalValue = min;
      }

      if (max !== undefined && newValue > max) {
        finalValue = max;
      }

      onChange?.(finalValue);
    });

    return (
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        ref={ref}
        className={cn('pr-0.5', className)}
        {...props}
      />
    );
  }
);

InputNumber.displayName = 'InputNumber';
