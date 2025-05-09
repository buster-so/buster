import React, { useMemo } from 'react';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { SelectAxisContainerId } from '../config';
import { EditShowAxisTitle } from './EditShowAxisTitle';
import type { ColumnLabelFormat, ComboChartAxis } from '@/api/asset_interfaces/metric/charts';
import { AXIS_TITLE_SEPARATOR } from '@/components/ui/charts/commonHelpers/axisHelper';
import { formatLabel } from '@/lib';
import { useMemoizedFn } from '@/hooks';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditAxisScale } from './EditAxisScale';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useUpdateMetricChart } from '@/context/Metrics';

export const Y2AxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis) as ComboChartAxis;
  const columnLabelFormats = useSelectAxisContextSelector((x) => x.columnLabelFormats);
  const y2AxisAxisTitle = useSelectAxisContextSelector((x) => x.y2AxisAxisTitle);
  const y2AxisShowAxisLabel = useSelectAxisContextSelector((x) => x.y2AxisShowAxisLabel);
  const y2AxisScaleType = useSelectAxisContextSelector((x) => x.y2AxisScaleType);
  const y2AxisShowAxisTitle = useSelectAxisContextSelector((x) => x.y2AxisShowAxisTitle);

  const y2Axis: string[] = useMemo(() => {
    return selectedAxis?.y2 || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelForamts: ColumnLabelFormat[] = useMemo(() => {
    return y2Axis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, y2Axis]);

  const formattedColumnTitle: string = useMemo(() => {
    return y2Axis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [y2AxisAxisTitle, y2Axis, assosciatedColumnLabelForamts]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisAxisTitle: value
      }
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisShowAxisLabel: value
      }
    });
  });

  const onChangeAxisScale = useMemoizedFn(
    (y2AxisScaleType: IBusterMetricChartConfig['y2AxisScaleType']) => {
      onUpdateMetricChartConfig({
        chartConfig: {
          y2AxisScaleType
        }
      });
    }
  );

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisShowAxisTitle: value
      }
    });
  });

  return (
    <>
      <EditShowAxisTitle
        axisTitle={y2AxisAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
        showAxisTitle={y2AxisShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={y2AxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisScale scaleType={y2AxisScaleType} onChangeAxisScale={onChangeAxisScale} />
    </>
  );
});
Y2AxisSettingContent.displayName = 'Y2AxisSettingContent';
