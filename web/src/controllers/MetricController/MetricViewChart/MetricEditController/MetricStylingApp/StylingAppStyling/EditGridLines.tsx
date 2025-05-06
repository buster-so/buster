import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';

export const EditGridLines: React.FC<{
  gridLines: IBusterMetricChartConfig['gridLines'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ gridLines, onUpdateChartConfig }) => {
  return (
    <LabelAndInput label={'Grid lines'}>
      <div className="flex justify-end">
        <Switch
          checked={gridLines}
          onCheckedChange={(v) => onUpdateChartConfig({ gridLines: v })}
        />
      </div>
    </LabelAndInput>
  );
});
EditGridLines.displayName = 'EditGridLines';
