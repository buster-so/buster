import { Input } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';
import { TrendlineLabelPositionOffset } from './TrendlineLabelPositionOffset';
import { TrendlineOffset } from './TrendlineOffset';
import { trendlineOptions } from './config';

export const TrendlineLabel = React.memo(
  ({
    trend,

    onUpdateExistingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExistingTrendline: (trend: LoopTrendline) => void;
  }) => {
    const { showTrendlineLabel, trendlineLabel, type } = trend;

    const trendlineLabelPlaceholder: string = useMemo(() => {
      return (
        (trendlineOptions.find((option) => option.value === type)?.label as string) ||
        'Trend line label'
      );
    }, [type]);

    const onChangeSwitch = useMemoizedFn((checked: boolean) => {
      onUpdateExistingTrendline({ ...trend, showTrendlineLabel: checked });
    });

    const onChangeInput = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateExistingTrendline({ ...trend, trendlineLabel: e.target.value || null });
    });

    return (
      <>
        <LabelAndInput label="Show label">
          <div className="flex w-full justify-end">
            <Switch checked={showTrendlineLabel} onCheckedChange={onChangeSwitch} />
          </div>
        </LabelAndInput>

        {showTrendlineLabel && (
          <>
            <LabelAndInput label="Label">
              <Input
                value={trendlineLabel || ''}
                className="w-full"
                placeholder={trendlineLabelPlaceholder as string}
                onChange={onChangeInput}
              />
            </LabelAndInput>

            <TrendlineOffset trend={trend} onUpdateExistingTrendline={onUpdateExistingTrendline} />

            <TrendlineLabelPositionOffset
              trend={trend}
              onUpdateExistingTrendline={onUpdateExistingTrendline}
            />
          </>
        )}
      </>
    );
  }
);
TrendlineLabel.displayName = 'TrendlineLabel';
