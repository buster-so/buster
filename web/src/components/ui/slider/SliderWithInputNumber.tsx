import React, { useEffect, useMemo } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { InputNumber } from '../inputs';
import { Slider } from './Slider';

interface SliderWithInputNumberProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export const SliderWithInputNumber: React.FC<SliderWithInputNumberProps> = ({
  min,
  max,
  value,
  onChange
}) => {
  const [internalValue, setInternalValue] = React.useState(value);

  const onChangeSlider = useMemoizedFn((value: number[]) => {
    setInternalValue(value[0]);
    onChange(value[0]);
  });

  const onChangeInputNumber = useMemoizedFn((value: number) => {
    setInternalValue(value);
    onChange(value);
  });

  const styleOfInputNumber = useMemo(() => {
    return { width: `${internalValue.toString().length * 17}px` };
  }, [internalValue]);

  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  return (
    <div className="flex items-center space-x-3">
      <InputNumber
        className="min-w-[50px]"
        style={styleOfInputNumber}
        min={min}
        max={max}
        value={internalValue}
        onChange={onChangeInputNumber}
      />
      <Slider
        className="w-full"
        min={min}
        max={max}
        value={[internalValue]}
        onValueChange={onChangeSlider}
      />
    </div>
  );
};
