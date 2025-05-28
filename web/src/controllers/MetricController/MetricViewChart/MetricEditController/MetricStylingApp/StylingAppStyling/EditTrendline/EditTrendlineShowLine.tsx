import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';

export const EditTrendlineShowLine = React.memo(
  ({
    trend,
    onUpdateExistingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExistingTrendline: (trend: LoopTrendline) => void;
  }) => {
    const { show } = trend;

    const onChange = useMemoizedFn((checked: boolean) => {
      onUpdateExistingTrendline({ ...trend, show: checked });
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
