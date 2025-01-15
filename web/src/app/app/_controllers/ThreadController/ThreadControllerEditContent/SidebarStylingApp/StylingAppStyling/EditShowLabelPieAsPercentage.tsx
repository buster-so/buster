import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Segmented } from 'antd';
import { useMemoizedFn } from 'ahooks';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest';

const options: { label: string; value: IBusterThreadMessageChartConfig['pieDisplayLabelAs'] }[] = [
  { label: '%', value: 'percent' },
  { label: '#', value: 'number' }
];

export const EditShowLabelPieAsPercentage = React.memo(
  ({
    pieDisplayLabelAs,
    onUpdateChartConfig
  }: {
    pieDisplayLabelAs: IBusterThreadMessageChartConfig['pieDisplayLabelAs'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  }) => {
    const onClickSegment = useMemoizedFn(
      (value: IBusterThreadMessageChartConfig['pieDisplayLabelAs']) => {
        onUpdateChartConfig({
          pieDisplayLabelAs: value as IBusterThreadMessageChartConfig['pieDisplayLabelAs']
        });
      }
    );

    const selectedValue = useMemo(() => {
      return options.find((option) => option.value === pieDisplayLabelAs)?.value || 'number';
    }, [pieDisplayLabelAs]);

    return (
      <LabelAndInput label="Show label as">
        <div className="flex w-full">
          <Segmented
            className="w-full"
            block
            options={options}
            onChange={onClickSegment}
            defaultValue={selectedValue}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => true
);
EditShowLabelPieAsPercentage.displayName = 'EditShowLabelPieAsPercentage';
