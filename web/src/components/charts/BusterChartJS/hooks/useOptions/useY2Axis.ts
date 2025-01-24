import {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ComboChartAxis
} from '@/components/charts/interfaces';
import { useMemoizedFn } from 'ahooks';
import type { DeepPartial } from 'utility-types';
import type { ScaleChartOptions, Scale } from 'chart.js';
import { useMemo } from 'react';
import { yAxisSimilar, formatYAxisLabel } from '@/components/charts/commonHelpers';
import { useY2AxisTitle } from '@/components/charts/commonHelpers/useY2AxisTitle';
import { DEFAULT_CHART_CONFIG } from '@/api/buster_rest';

export const useY2Axis = ({
  columnLabelFormats,
  selectedAxis: selectedAxisProp,
  selectedChartType,
  y2AxisAxisTitle,
  y2AxisShowAxisTitle,
  y2AxisShowAxisLabel,
  y2AxisStartAxisAtZero,
  y2AxisScaleType
}: {
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  y2AxisAxisTitle: BusterChartProps['y2AxisAxisTitle'];
  y2AxisShowAxisTitle: BusterChartProps['y2AxisShowAxisTitle'];
  y2AxisShowAxisLabel: BusterChartProps['y2AxisShowAxisLabel'];
  y2AxisStartAxisAtZero: BusterChartProps['y2AxisStartAxisAtZero'];
  y2AxisScaleType: BusterChartProps['y2AxisScaleType'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']> | undefined => {
  const selectedAxis = selectedAxisProp as ComboChartAxis;

  const isSupportedType = useMemo(() => {
    return selectedChartType === ChartType.Combo;
  }, [selectedChartType]);

  const canUseSameY2Formatter = useMemo(() => {
    if (!isSupportedType) return false;

    const hasMultipleY = selectedAxis.y2!.length > 1;
    return hasMultipleY ? yAxisSimilar(selectedAxis.y2!, columnLabelFormats) : true;
  }, [selectedAxis.y2, columnLabelFormats, isSupportedType]);

  const title = useY2AxisTitle({
    y2Axis: selectedAxis.y2 || DEFAULT_CHART_CONFIG.comboChartAxis.y2!,
    columnLabelFormats,
    y2AxisAxisTitle,
    y2AxisShowAxisTitle,
    isSupportedChartForAxisTitles: selectedChartType === ChartType.Combo
  });

  const type = useMemo(() => {
    if (!isSupportedType) return undefined;
    return y2AxisScaleType === 'log' ? 'logarithmic' : 'linear';
  }, [y2AxisScaleType, isSupportedType]);

  const tickCallback = useMemoizedFn(function (this: Scale, value: string | number, index: number) {
    const labelValue = this.getLabelForValue(index);
    return formatYAxisLabel(
      labelValue,
      selectedAxis.y2!,
      canUseSameY2Formatter,
      columnLabelFormats,
      false
    );
  });

  const memoizedYAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']> | undefined =
    useMemo(() => {
      if (!isSupportedType)
        return {
          display: false
        };

      return {
        type,
        position: 'right',
        display: y2AxisShowAxisLabel !== false && selectedAxis.y2 && selectedAxis.y2?.length > 0,
        beginAtZero: y2AxisStartAxisAtZero !== false,
        title: {
          display: !!title,
          text: title
        },
        ticks: {
          tickLength: 20,
          autoSkip: true,
          autoSkipPadding: 2,
          callback: tickCallback
        },
        grid: {
          drawOnChartArea: false // only want the grid lines for one axis to show up
        }
      } as DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']>;
    }, [
      tickCallback,
      title,
      selectedAxis.y2?.join(','),
      isSupportedType,
      y2AxisShowAxisLabel,
      y2AxisStartAxisAtZero,
      type
    ]);

  return memoizedYAxisOptions;
};
