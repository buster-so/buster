import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Select, type SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../Common';

const options: SelectItem<NonNullable<ChartConfigProps['pieLabelPosition']>>[] = [
  { label: 'Outside', value: 'outside' },
  { label: 'Inside', value: 'inside' }
];

export const EditPieLabelLocation = React.memo(
  ({
    pieLabelPosition,
    onUpdateChartConfig
  }: {
    pieLabelPosition: ChartConfigProps['pieLabelPosition'];
    onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
  }) => {
    const selectedLabelPosition = useMemo(() => {
      return options.find((option) => option.value === pieLabelPosition)?.value || 'outside';
    }, [pieLabelPosition]);
    const hideLabel = pieLabelPosition === 'none' || !pieLabelPosition;

    const onChangeSelect = useMemoizedFn((value: ChartConfigProps['pieLabelPosition']) => {
      onUpdateChartConfig({ pieLabelPosition: value });
    });

    const onChangeSwitch = useMemoizedFn((value: boolean) => {
      onUpdateChartConfig({
        pieLabelPosition: value ? 'inside' : 'none'
      });
    });

    return (
      <>
        <LabelAndInput label="Show label">
          <div className="flex w-full justify-end">
            <Switch checked={!hideLabel} onCheckedChange={onChangeSwitch} />
          </div>
        </LabelAndInput>
        {!hideLabel && (
          <LabelAndInput label="Label location">
            <div className="flex w-full justify-end">
              <Select
                className="w-full"
                items={options}
                value={selectedLabelPosition}
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
