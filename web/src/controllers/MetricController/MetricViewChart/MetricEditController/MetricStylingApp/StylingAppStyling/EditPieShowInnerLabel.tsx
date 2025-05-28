import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Switch } from '@/components/ui/switch';
import React from 'react';
import { LabelAndInput } from '../Common';

export const EditPieShowInnerLabel = React.memo(
  ({
    pieShowInnerLabel,
    onUpdateChartConfig
  }: {
    pieShowInnerLabel: IBusterMetricChartConfig['pieShowInnerLabel'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    return (
      <LabelAndInput label="Show inner label">
        <div className="flex w-full items-center justify-end space-x-2.5">
          <Switch
            checked={pieShowInnerLabel}
            onCheckedChange={(value) => onUpdateChartConfig({ pieShowInnerLabel: value })}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditPieShowInnerLabel.displayName = 'EditPieShowInnerLabel';
