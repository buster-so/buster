import React, { useState } from 'react';
import { LabelAndInput } from '../Common';
import { InputNumber, Slider } from 'antd';
import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { useMemoizedFn } from 'ahooks';

export const EditPieMinimumSlicePercentage = React.memo(
  ({
    pieMinimumSlicePercentage: initialValue,
    onUpdateChartConfig
  }: {
    pieMinimumSlicePercentage: IBusterThreadMessageChartConfig['pieMinimumSlicePercentage'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  }) => {
    const [pieMinimumSlicePercentage, setIntermediateValue] = useState(initialValue);

    const onChange = useMemoizedFn((value: number) => {
      setIntermediateValue(value);
      onUpdateChartConfig({ pieMinimumSlicePercentage: value });
    });

    return (
      <LabelAndInput label="Minimum slice %">
        <div className="flex flex-row items-center gap-2">
          <InputNumber
            min={0}
            max={100}
            placeholder="2.5"
            className="max-w-[50px]"
            value={pieMinimumSlicePercentage}
            onChange={(value) => onChange(value || 0)}
          />
          <Slider
            className="w-full"
            min={0}
            max={100}
            value={pieMinimumSlicePercentage}
            onChange={(value) => onChange(value || 0)}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditPieMinimumSlicePercentage.displayName = 'EditPieMinimumSlicePercentage';
