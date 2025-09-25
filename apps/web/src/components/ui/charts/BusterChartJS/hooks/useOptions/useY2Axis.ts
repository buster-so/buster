import {
  type ChartConfigProps,
  type ChartEncodes,
  type ChartType,
  type ColumnLabelFormat,
  type ComboChartAxis,
  DEFAULT_CHART_CONFIG,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { fa } from '@faker-js/faker';
import type {
  CartesianScaleTypeRegistry,
  Scale,
  ScaleChartOptions,
  ScaleOptionsByType,
} from 'chart.js';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterChartProps } from '../../../BusterChart.types';
import { formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { useY2AxisTitle } from './axisHooks/useY2AxisTitle';

export const DEFAULT_Y2_AXIS_COUNT = 9;

export const useY2Axis = ({
  columnLabelFormats,
  selectedAxis: selectedAxisProp,
  selectedChartType,
  y2AxisAxisTitle,
  y2AxisShowAxisTitle,
  y2AxisShowAxisLabel,
  y2AxisStartAxisAtZero,
  y2AxisScaleType,
  yAxis,
}: {
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  y2AxisAxisTitle: BusterChartProps['y2AxisAxisTitle'];
  y2AxisShowAxisTitle: BusterChartProps['y2AxisShowAxisTitle'];
  y2AxisShowAxisLabel: BusterChartProps['y2AxisShowAxisLabel'];
  y2AxisStartAxisAtZero: BusterChartProps['y2AxisStartAxisAtZero'];
  y2AxisScaleType: BusterChartProps['y2AxisScaleType'];
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  yAxis: DeepPartial<ScaleOptionsByType<keyof CartesianScaleTypeRegistry> | undefined>;
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']> | undefined => {
  const selectedAxis = selectedAxisProp as ComboChartAxis;
  const y2AxisKeys = selectedAxis.y2 || [];
  const yAxisMinValue = yAxis?.min;
  const yAxisMaxValue = yAxis?.max;

  const y2AxisKeysString = useMemo(() => {
    return y2AxisKeys.join(',');
  }, [y2AxisKeys]);

  const isSupportedType = useMemo(() => {
    return selectedChartType === 'combo';
  }, [selectedChartType]);

  const canUseSameY2Formatter = useMemo(() => {
    if (!isSupportedType) return false;

    const hasMultipleY = (y2AxisKeys.length || 0) > 1;
    return hasMultipleY ? yAxisSimilar(y2AxisKeys, columnLabelFormats) : true;
  }, [y2AxisKeysString, columnLabelFormats, isSupportedType]);

  const title = useY2AxisTitle({
    y2Axis: y2AxisKeys || DEFAULT_CHART_CONFIG.comboChartAxis.y2 || [],
    columnLabelFormats,
    y2AxisAxisTitle,
    y2AxisShowAxisTitle,
    isSupportedChartForAxisTitles: selectedChartType === 'combo',
  });

  const type = useMemo(() => {
    if (!isSupportedType) return undefined;
    return y2AxisScaleType === 'log' ? 'logarithmic' : 'linear';
  }, [y2AxisScaleType, isSupportedType]);

  const y2AxisColumnFormats: Record<string, ColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return y2AxisKeys.reduce<Record<string, ColumnLabelFormat>>((acc, y) => {
      acc[y] = columnLabelFormats[y] || DEFAULT_COLUMN_LABEL_FORMAT;
      return acc;
    }, {});
  }, [y2AxisKeysString, columnLabelFormats]);

  const tickCallback = useMemoizedFn(function (
    this: Scale,
    value: string | number,
    _index: number
  ) {
    return formatYAxisLabel(value, y2AxisKeys, canUseSameY2Formatter, y2AxisColumnFormats, false);
  });

  const memoizedYAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']> | undefined =
    useMemo(() => {
      if (!isSupportedType)
        return {
          display: false,
        };

      const baseConfig = {
        type,
        position: 'right',
        display: y2AxisShowAxisLabel !== false && y2AxisKeys.length > 0,
        beginAtZero: y2AxisStartAxisAtZero !== false,
        title: {
          display: !!title,
          text: title,
        },
        ticks: {
          count: DEFAULT_Y2_AXIS_COUNT,
          autoSkip: true,
          callback: tickCallback,
          includeBounds: true,
        },
        min: yAxisMinValue,
        max: yAxisMaxValue,
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      } as DeepPartial<ScaleChartOptions<'bar'>['scales']['y2']>;

      return baseConfig;
    }, [
      tickCallback,
      title,
      yAxisMinValue,
      y2AxisKeysString,
      isSupportedType,
      y2AxisShowAxisLabel,
      y2AxisStartAxisAtZero,
      type,
    ]);

  return memoizedYAxisOptions;
};
