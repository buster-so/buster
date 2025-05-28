import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { EditBarRoundness } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditBarRoundness';
import { useMemoizedFn } from '@/hooks';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';

export const EditBarRoundnessGlobal: React.FC<{
  columnSettings: IBusterMetricChartConfig['columnSettings'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const mostPermissiveBarRoundness = useMemo(() => {
    return Object.values(columnSettings).reduce((acc, curr) => {
      return Math.min(acc, curr.barRoundness);
    }, Number.POSITIVE_INFINITY);
  }, []);

  const onUpdateBarRoundness = useMemoizedFn((v: Partial<ColumnSettings>) => {
    const newColumnSettings: IBusterMetricChartConfig['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<IBusterMetricChartConfig['columnSettings']>((acc, curr) => {
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
