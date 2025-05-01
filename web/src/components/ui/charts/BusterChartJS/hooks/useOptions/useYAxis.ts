import {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  ChartType,
  IColumnLabelFormat
} from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import type { DeepPartial } from 'utility-types';
import type { ScaleChartOptions, Scale, GridLineOptions } from 'chart.js';
import { useMemo } from 'react';
import { yAxisSimilar, formatYAxisLabel } from '../../../commonHelpers';
import { useIsStacked } from './useIsStacked';
import { useYAxisTitle } from './axisHooks/useYAxisTitle';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

export const useYAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  columnMetadata,
  barGroupType,
  lineGroupType,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  yAxisShowAxisLabel,
  yAxisStartAxisAtZero,
  yAxisScaleType,
  gridLines
}: {
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']> | undefined;
  barGroupType: BusterChartProps['barGroupType'];
  lineGroupType: BusterChartProps['lineGroupType'];
  yAxisAxisTitle: BusterChartProps['yAxisAxisTitle'];
  yAxisShowAxisTitle: BusterChartProps['yAxisShowAxisTitle'];
  yAxisShowAxisLabel: BusterChartProps['yAxisShowAxisLabel'];
  yAxisStartAxisAtZero: BusterChartProps['yAxisStartAxisAtZero'];
  yAxisScaleType: BusterChartProps['yAxisScaleType'];
  gridLines: BusterChartProps['gridLines'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['y']> | undefined => {
  const yAxisKeys = selectedAxis.y;

  const isSupportedType = useMemo(() => {
    return selectedChartType !== ChartType.Pie;
  }, [selectedChartType]);

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: gridLines
    } satisfies DeepPartial<GridLineOptions>;
  }, [gridLines]);

  const usePercentageModeAxis = useMemo(() => {
    if (!isSupportedType) return false;
    if (selectedChartType === 'bar') return barGroupType === 'percentage-stack';
    if (selectedChartType === 'line') return lineGroupType === 'percentage-stack';
    return false;
  }, [lineGroupType, selectedChartType, barGroupType, isSupportedType]);

  const yAxisColumnFormats: Record<string, IColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.y.reduce<Record<string, IColumnLabelFormat>>((acc, y) => {
      acc[y] = columnLabelFormats[y] || DEFAULT_COLUMN_LABEL_FORMAT;
      return acc;
    }, {});
  }, [selectedAxis.y, columnLabelFormats, isSupportedType]);

  const stacked = useIsStacked({ selectedChartType, lineGroupType, barGroupType });

  const canUseSameYFormatter = useMemo(() => {
    if (!isSupportedType) return false;

    const hasMultipleY = selectedAxis.y.length > 1;
    return hasMultipleY ? yAxisSimilar(selectedAxis.y, columnLabelFormats) : true;
  }, [selectedAxis.y, columnLabelFormats, isSupportedType]);

  const title = useYAxisTitle({
    yAxis: selectedAxis.y,
    columnLabelFormats,
    yAxisAxisTitle,
    yAxisShowAxisTitle,
    selectedAxis,
    isSupportedChartForAxisTitles: isSupportedType
  });

  const tickCallback = useMemoizedFn(function (this: Scale, value: string | number, index: number) {
    return formatYAxisLabel(
      value,
      yAxisKeys,
      canUseSameYFormatter,
      yAxisColumnFormats,
      usePercentageModeAxis
    );
  });

  const type = useMemo(() => {
    if (!isSupportedType) return undefined;
    return yAxisScaleType === 'log' ? 'logarithmic' : 'linear';
  }, [yAxisScaleType, isSupportedType]);

  const memoizedYAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['y']> | undefined =
    useMemo(() => {
      if (!isSupportedType) return undefined;

      return {
        type,
        grid,
        max: usePercentageModeAxis ? 100 : undefined,
        beginAtZero: yAxisStartAxisAtZero !== false,
        stacked,
        title: {
          display: !!title,
          text: title
        },
        ticks: {
          display: yAxisShowAxisLabel,
          callback: tickCallback
        },
        border: {
          display: yAxisShowAxisLabel
        }
      } satisfies DeepPartial<ScaleChartOptions<'bar'>['scales']['y']>;
    }, [
      tickCallback,
      type,
      title,
      stacked,
      grid,
      isSupportedType,
      yAxisStartAxisAtZero,
      yAxisShowAxisLabel,
      usePercentageModeAxis
    ]);

  return memoizedYAxisOptions;
};
