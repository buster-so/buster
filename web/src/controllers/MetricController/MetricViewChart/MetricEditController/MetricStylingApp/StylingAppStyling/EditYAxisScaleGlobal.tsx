import React, { useMemo } from 'react';
import { EditAxisScale } from '../StylingAppVisualize/SelectAxis/SelectAxisSettingsContent/EditAxisScale';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';

export const EditYAxisScaleGlobal: React.FC<{
  yAxisScaleType: IBusterMetricChartConfig['yAxisScaleType'];
  y2AxisScaleType: IBusterMetricChartConfig['y2AxisScaleType'];
  onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(({ yAxisScaleType, y2AxisScaleType, onUpdateChartConfig }) => {
  const mostPermissiveScale = useMemo(() => {
    return yAxisScaleType === y2AxisScaleType ? yAxisScaleType : 'linear';
  }, [yAxisScaleType, y2AxisScaleType]);

  const onChangeAxisScale = useMemoizedFn((value: IBusterMetricChartConfig['yAxisScaleType']) => {
    onUpdateChartConfig({
      yAxisScaleType: value,
      y2AxisScaleType: value
    });
  });

  return <EditAxisScale scaleType={mostPermissiveScale} onChangeAxisScale={onChangeAxisScale} />;
});
EditYAxisScaleGlobal.displayName = 'EditYAxisScaleGlobal';
