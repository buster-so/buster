import {
  type ChartConfigProps,
  type ChartEncodes,
  type ChartType,
  type ColumnLabelFormat,
  type ComboChartAxis,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import type { GridLineOptions, Scale, ScaleChartOptions } from 'chart.js';
import clamp from 'lodash/clamp';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterChartProps } from '../../../BusterChart.types';
import { formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { useYAxisTitle } from './axisHooks/useYAxisTitle';
import { useIsStacked } from './useIsStacked';
import { DEFAULT_Y2_AXIS_COUNT } from './useY2Axis';
import { useYTickValues } from './useYTickValues';

export const useYAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  barGroupType,
  lineGroupType,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  yAxisShowAxisLabel,
  yAxisStartAxisAtZero,
  yAxisScaleType,
  gridLines,
  columnMetadata,
}: {
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
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
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  gridLines: BusterChartProps['gridLines'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['y']> | undefined => {
  const yAxisKeys = selectedAxis.y;
  const y2AxisKeys = (selectedAxis as ComboChartAxis)?.y2 || [];
  const hasY2Axis = y2AxisKeys.length > 0;

  const isSupportedType = useMemo(() => {
    return selectedChartType !== 'pie';
  }, [selectedChartType]);

  const { minTickValue, maxTickValue } = useYTickValues({
    hasY2Axis,
    columnMetadata,
    selectedChartType,
    yAxisKeys,
    y2AxisKeys,
    columnLabelFormats,
  });

  const defaultTickCount = useMemo(() => {
    if (y2AxisKeys.length > 0 && minTickValue !== undefined) return DEFAULT_Y2_AXIS_COUNT;
  }, [minTickValue]);

  const yMaxValue = useMemo(() => {
    return yAxisKeys.reduce((max, key) => {
      const column = columnMetadata?.find((col) => col.name === key);
      return Math.max(max, Number(column?.max_value ?? 0));
    }, -Infinity);
  }, [columnMetadata, yAxisKeys]);

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: gridLines,
    } satisfies DeepPartial<GridLineOptions>;
  }, [gridLines]);

  const usePercentageModeAxis: false | '100' | 'clamp' = useMemo(() => {
    if (!isSupportedType) return false;
    if (selectedChartType === 'bar') {
      if (barGroupType === 'percentage-stack') return '100';
    }
    if (selectedChartType === 'line') {
      if (lineGroupType === 'percentage-stack') return 'clamp';
    }

    const hasPercentageAxis = yAxisKeys.some((key) => columnLabelFormats[key]?.style === 'percent');
    if (hasPercentageAxis) return 'clamp';

    return false;
  }, [
    lineGroupType,
    selectedChartType,
    barGroupType,
    isSupportedType,
    columnLabelFormats,
    yAxisKeys,
  ]);

  const yAxisColumnFormats: Record<string, ColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.y.reduce<Record<string, ColumnLabelFormat>>((acc, y) => {
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
    isSupportedChartForAxisTitles: isSupportedType,
  });

  const tickCallback = useMemoizedFn(function (
    this: Scale,
    value: string | number,
    _index: number
  ) {
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
        beginAtZero: yAxisStartAxisAtZero !== false,
        stacked,
        title: {
          display: !!title,
          text: title,
        },
        ticks: {
          display: yAxisShowAxisLabel,
          callback: tickCallback,
          count: defaultTickCount,
          includeBounds: true,
        },
        min: usePercentageModeAxis ? 0 : minTickValue,
        max:
          usePercentageModeAxis === 'clamp'
            ? Math.max(100, yMaxValue * 1.05)
            : usePercentageModeAxis === '100'
              ? 100
              : maxTickValue,
        border: {
          display: yAxisShowAxisLabel,
        },
      } as DeepPartial<ScaleChartOptions<'bar'>['scales']['y']>;
    }, [
      tickCallback,
      type,
      title,
      stacked,
      grid,
      isSupportedType,
      yAxisStartAxisAtZero,
      yAxisShowAxisLabel,
      usePercentageModeAxis,
      maxTickValue,
      minTickValue,
      defaultTickCount,
      yMaxValue,
    ]);

  return memoizedYAxisOptions;
};
