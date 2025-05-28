import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { InputNumber } from '@/components/ui/inputs';
import { Slider, SliderWithInputNumber } from '@/components/ui/slider';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { LabelAndInput } from '../Common';

export const EditPieMinimumSlicePercentage = React.memo(
  ({
    pieMinimumSlicePercentage: initialValue,
    onUpdateChartConfig
  }: {
    pieMinimumSlicePercentage: IBusterMetricChartConfig['pieMinimumSlicePercentage'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    const [pieMinimumSlicePercentage, setIntermediateValue] = useState(initialValue);

    const onChange = useMemoizedFn((value: number) => {
      setIntermediateValue(value);
      onUpdateChartConfig({ pieMinimumSlicePercentage: value });
    });

    const onChangeSlider = useMemoizedFn((value: number[]) => {
      onChange(value[0]);
    });

    return (
      <LabelAndInput label="Minimum slice %">
        <SliderWithInputNumber
          min={0}
          max={100}
          value={pieMinimumSlicePercentage}
          onChange={onChange}
        />
      </LabelAndInput>
    );
  }
);
EditPieMinimumSlicePercentage.displayName = 'EditPieMinimumSlicePercentage';
