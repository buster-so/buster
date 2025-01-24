import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { Select } from 'antd';

const options: { label: string; value: IBusterThreadMessageChartConfig['yAxisScaleType'] }[] = [
  { label: 'Linear', value: 'linear' },
  { label: 'Logarithmic', value: 'log' }
];

export const EditAxisScale: React.FC<{
  scaleType:
    | IBusterThreadMessageChartConfig['yAxisScaleType']
    | IBusterThreadMessageChartConfig['y2AxisScaleType'];
  onChangeAxisScale: (value: IBusterThreadMessageChartConfig['yAxisScaleType']) => void;
}> = React.memo(
  ({ scaleType, onChangeAxisScale }) => {
    return (
      <LabelAndInput label="Scale">
        <Select options={options} defaultValue={scaleType} onChange={onChangeAxisScale} />
      </LabelAndInput>
    );
  },
  (prevProps, nextProps) => {
    return true;
  }
);
EditAxisScale.displayName = 'EditAxisScale';
