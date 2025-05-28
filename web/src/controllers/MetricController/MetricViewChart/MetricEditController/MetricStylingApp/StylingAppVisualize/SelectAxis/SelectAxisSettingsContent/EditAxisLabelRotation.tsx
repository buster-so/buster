import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';

const options: SegmentedItem<IBusterMetricChartConfig['xAxisLabelRotation']>[] = [
  { label: 'Auto', value: 'auto' },
  { label: '0°', value: 0 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 }
];

export const EditAxisLabelRotation: React.FC<{
  xAxisLabelRotation: IBusterMetricChartConfig['xAxisLabelRotation'];
  onChangeLabelRotation: (value: IBusterMetricChartConfig['xAxisLabelRotation']) => void;
}> = React.memo(({ xAxisLabelRotation, onChangeLabelRotation }) => {
  const selectedOption: IBusterMetricChartConfig['xAxisLabelRotation'] = useMemo(() => {
    return (
      options.find((option) => option.value === xAxisLabelRotation)?.value ?? options[0]?.value!
    );
  }, [xAxisLabelRotation]);

  const onChange = useMemoizedFn((value: SegmentedItem<string>) => {
    onChangeLabelRotation(value.value as IBusterMetricChartConfig['xAxisLabelRotation']);
  });

  return (
    <LabelAndInput label="Axis orientation">
      <AppSegmented
        block
        options={options as SegmentedItem<string>[]}
        value={selectedOption as string}
        onChange={onChange}
      />
    </LabelAndInput>
  );
});
EditAxisLabelRotation.displayName = 'EditAxisLabelRotation';
