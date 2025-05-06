import { Switch } from '@/components/ui/switch';
import React from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';

export const EditTrendlineShowLine = React.memo(
  ({
    trend,
    onUpdateExisitingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
  }) => {
    const { show } = trend;

    const onChange = useMemoizedFn((checked: boolean) => {
      onUpdateExisitingTrendline({ ...trend, show: checked });
    });

    return (
      <LabelAndInput label="Show trend line">
        <div className="flex w-full justify-end">
          <Switch checked={show} onCheckedChange={onChange} />
        </div>
      </LabelAndInput>
    );
  }
);
EditTrendlineShowLine.displayName = 'EditTrendlineShowLine';
