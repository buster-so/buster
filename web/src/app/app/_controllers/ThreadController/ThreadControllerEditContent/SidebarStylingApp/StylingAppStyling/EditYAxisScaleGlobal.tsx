import React, { useMemo } from 'react';
import { EditAxisScale } from '../StylingAppVisualize/SelectAxis/SelectAxisSettingsContent/EditAxisScale';
import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads';
import { useMemoizedFn } from 'ahooks';

export const EditYAxisScaleGlobal: React.FC<{
  yAxisScaleType: IBusterThreadMessageChartConfig['yAxisScaleType'];
  y2AxisScaleType: IBusterThreadMessageChartConfig['y2AxisScaleType'];
  onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ yAxisScaleType, y2AxisScaleType, onUpdateChartConfig }) => {
    const mostPermissiveScale = useMemo(() => {
      return yAxisScaleType === y2AxisScaleType ? yAxisScaleType : 'linear';
    }, [yAxisScaleType, y2AxisScaleType]);

    const onChangeAxisScale = useMemoizedFn(
      (value: IBusterThreadMessageChartConfig['yAxisScaleType']) => {
        onUpdateChartConfig({
          yAxisScaleType: value,
          y2AxisScaleType: value
        });
      }
    );

    return <EditAxisScale scaleType={mostPermissiveScale} onChangeAxisScale={onChangeAxisScale} />;
  },
  () => {
    return true;
  }
);
EditYAxisScaleGlobal.displayName = 'EditYAxisScaleGlobal';
