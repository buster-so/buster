import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { formatLabel } from '@/lib/columnFormatter';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { EditAxisLabelRotation } from './EditAxisLabelRotation';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditShowAxisTitle } from './EditShowAxisTitle';
import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';

export const XAxisSettingContent: React.FC = React.memo(() => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();
  const xAxisAxisTitle = useSelectAxisContextSelector((x) => x.xAxisAxisTitle);
  const columnLabelFormats = useSelectAxisContextSelector((x) => x.columnLabelFormats);
  const xAxisShowAxisLabel = useSelectAxisContextSelector((x) => x.xAxisShowAxisLabel);
  const xAxisLabelRotation = useSelectAxisContextSelector((x) => x.xAxisLabelRotation);
  const xAxisShowAxisTitle = useSelectAxisContextSelector((x) => x.xAxisShowAxisTitle);
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);

  const xAxis: string[] = useMemo(() => {
    return selectedAxis?.x || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelFormats: ColumnLabelFormat[] = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, xAxis]);

  const formattedColumnTitle: string = useMemo(() => {
    return xAxis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [xAxisAxisTitle, xAxis, assosciatedColumnLabelFormats]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisAxisTitle: value
      }
    });
  });

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisShowAxisTitle: value
      }
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisShowAxisLabel: value
      }
    });
  });

  const onChangeLabelRotation = useMemoizedFn(
    (xAxisLabelRotation: ChartConfigProps['xAxisLabelRotation']) => {
      onUpdateMetricChartConfig({
        chartConfig: {
          xAxisLabelRotation
        }
      });
    }
  );

  return (
    <>
      <EditShowAxisTitle
        axisTitle={xAxisAxisTitle}
        showAxisTitle={xAxisShowAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={xAxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisLabelRotation
        xAxisLabelRotation={xAxisLabelRotation}
        onChangeLabelRotation={onChangeLabelRotation}
      />
    </>
  );
});
XAxisSettingContent.displayName = 'XAxisSettingContent';
