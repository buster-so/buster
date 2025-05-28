import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';

import { useMemoizedFn } from '@/hooks';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';

const options: SegmentedItem<'percent' | 'number'>[] = [
  { label: '%', value: 'percent' },
  { label: '#', value: 'number' }
];

export const EditShowLabelPieAsPercentage = React.memo(
  ({
    pieDisplayLabelAs,
    onUpdateChartConfig
  }: {
    pieDisplayLabelAs: IBusterMetricChartConfig['pieDisplayLabelAs'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    const selectedValue = useMemo(() => {
      return options.find((option) => option.value === pieDisplayLabelAs)?.value || 'number';
    }, [pieDisplayLabelAs]);

    const onChange = useMemoizedFn((value: SegmentedItem<'percent' | 'number'>) => {
      onUpdateChartConfig({
        pieDisplayLabelAs: value.value
      });
    });

    return (
      <LabelAndInput label="Show label as">
        <div className="flex w-full">
          <AppSegmented
            className="w-full"
            block
            options={options}
            onChange={onChange}
            value={selectedValue}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditShowLabelPieAsPercentage.displayName = 'EditShowLabelPieAsPercentage';
