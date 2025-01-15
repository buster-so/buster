import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import React, { useMemo } from 'react';
import { EditBarRoundness } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditBarRoundness';
import { useMemoizedFn } from 'ahooks';
import { ColumnSettings } from '@/components/charts';

export const EditBarRoundnessGlobal: React.FC<{
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const mostPermissiveBarRoundness = useMemo(() => {
    return Object.values(columnSettings).reduce((acc, curr) => {
      return Math.min(acc, curr.barRoundness);
    }, Infinity);
  }, []);

  const onUpdateBarRoundness = useMemoizedFn((v: Partial<ColumnSettings>) => {
    const newColumnSettings: IBusterThreadMessageChartConfig['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<IBusterThreadMessageChartConfig['columnSettings']>((acc, curr) => {
      acc[curr] = { ...columnSettings[curr], ...v };
      return acc;
    }, {});

    onUpdateChartConfig({ columnSettings: newColumnSettings });
  });

  return (
    <EditBarRoundness
      barRoundness={mostPermissiveBarRoundness}
      onUpdateColumnSettingConfig={onUpdateBarRoundness}
    />
  );
});
EditBarRoundnessGlobal.displayName = 'EditBarRoundnessGlobal';
