import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import type { IBusterThreadMessageChartConfig } from '@/api/busterv2/threads/threadConfigInterfaces';

export const EditGridLines: React.FC<{
  gridLines: IBusterThreadMessageChartConfig['gridLines'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ gridLines, onUpdateChartConfig }) => {
    return (
      <LabelAndInput label={'Grid lines'}>
        <div className="flex justify-end">
          <Switch
            defaultChecked={gridLines}
            onChange={(v) => onUpdateChartConfig({ gridLines: v })}
          />
        </div>
      </LabelAndInput>
    );
  },
  (prev, next) => {
    return true;
  }
);
EditGridLines.displayName = 'EditGridLines';
