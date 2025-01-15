import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import { useMemoizedFn } from 'ahooks';

export const EditSmoothLinesGlobal: React.FC<{
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const allSmooth = useMemo(() => {
    return Object.values(columnSettings).every((column) => column.lineType === 'smooth');
  }, [columnSettings]);

  const onChangeAllSmooth = useMemoizedFn((value: boolean) => {
    onUpdateChartConfig({
      columnSettings: Object.keys(columnSettings).reduce<
        IBusterThreadMessageChartConfig['columnSettings']
      >((acc, curr) => {
        acc[curr] = { ...columnSettings[curr], lineType: value ? 'smooth' : 'normal' };
        return acc;
      }, {})
    });
  });

  return (
    <LabelAndInput label="Smooth lines">
      <div className="flex w-full justify-end">
        <Switch defaultChecked={allSmooth} onChange={onChangeAllSmooth} />
      </div>
    </LabelAndInput>
  );
});
EditSmoothLinesGlobal.displayName = 'EditSmoothLinesGlobal';
