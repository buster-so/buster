import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ColumnLabelFormat, ComboChartAxis } from '@buster/server-shared/metrics';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { formatLabel } from '@/lib/columnFormatter';
import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { EditAxisScale } from './EditAxisScale';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditShowAxisTitle } from './EditShowAxisTitle';

export const Y2AxisSettingContent: React.FC = React.memo(() => {
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
    (y2AxisScaleType: ChartConfigProps['y2AxisScaleType']) => {
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
