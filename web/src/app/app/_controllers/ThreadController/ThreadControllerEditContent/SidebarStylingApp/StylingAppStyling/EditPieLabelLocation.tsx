import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Select, Switch } from 'antd';
import {
  DEFAULT_CHART_CONFIG,
  type IBusterThreadMessageChartConfig
} from '@/api/buster-rest/threads';
import { useMemoizedFn } from 'ahooks';

const options: { label: string; value: IBusterThreadMessageChartConfig['pieLabelPosition'] }[] = [
  { label: 'Outside', value: 'outside' },
  { label: 'Inside', value: 'inside' }
];

export const EditPieLabelLocation = React.memo(
  ({
    pieLabelPosition,
    onUpdateChartConfig
  }: {
    pieLabelPosition: IBusterThreadMessageChartConfig['pieLabelPosition'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
  }) => {
    const selectedLabelPosition = useMemo(() => {
      return options.find((option) => option.value === pieLabelPosition)?.value || 'outside';
    }, [pieLabelPosition]);
    const hideLabel = pieLabelPosition === 'none';

    const onChangeSelect = useMemoizedFn(
      (value: IBusterThreadMessageChartConfig['pieLabelPosition']) => {
        onUpdateChartConfig({ pieLabelPosition: value });
      }
    );

    const onChangeSwitch = useMemoizedFn((value: boolean) => {
      onUpdateChartConfig({
        pieLabelPosition: value ? 'inside' : 'none'
      });
    });

    return (
      <>
        <LabelAndInput label="Show label">
          <div className="flex w-full justify-end">
            <Switch checked={!hideLabel} onChange={onChangeSwitch} />
          </div>
        </LabelAndInput>
        {!hideLabel && (
          <LabelAndInput label="Label location">
            <div className="flex w-full justify-end">
              <Select
                className="w-full"
                options={options}
                defaultValue={selectedLabelPosition}
                onChange={onChangeSelect}
              />
            </div>
          </LabelAndInput>
        )}
      </>
    );
  }
);
EditPieLabelLocation.displayName = 'EditPieLabelLocation';
