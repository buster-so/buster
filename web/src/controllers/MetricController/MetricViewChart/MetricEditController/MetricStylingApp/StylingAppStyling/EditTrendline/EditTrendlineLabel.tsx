import { Input } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/switch';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { trendlineOptions } from './config';
import { useMemoizedFn } from '@/hooks';

export const TrendlineLabel = React.memo(
  ({
    trend,

    onUpdateExisitingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
  }) => {
    const { showTrendlineLabel, trendlineLabel, type } = trend;

    const trendlineLabelPlaceholder: string = useMemo(() => {
      return (
        (trendlineOptions.find((option) => option.value === type)?.label as string) ||
        'Trend line label'
      );
    }, [type]);

    const onChangeSwitch = useMemoizedFn((checked: boolean) => {
      onUpdateExisitingTrendline({ ...trend, showTrendlineLabel: checked });
    });

    const onChangeInput = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateExisitingTrendline({ ...trend, trendlineLabel: e.target.value || null });
    });

    return (
      <>
        <LabelAndInput label="Show label">
          <div className="flex w-full justify-end">
            <Switch checked={showTrendlineLabel} onCheckedChange={onChangeSwitch} />
          </div>
        </LabelAndInput>

        {showTrendlineLabel && (
          <LabelAndInput label="Label">
            <Input
              value={trendlineLabel || ''}
              className="w-full"
              placeholder={trendlineLabelPlaceholder as string}
              onChange={onChangeInput}
            />
          </LabelAndInput>
        )}
      </>
    );
  }
);
TrendlineLabel.displayName = 'TrendlineLabel';
