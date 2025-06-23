import React from 'react';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

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
