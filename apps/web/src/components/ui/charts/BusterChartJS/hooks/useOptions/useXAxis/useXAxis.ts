import {
  type ChartConfigProps,
  type ChartEncodes,
  type ChartType,
  type ColumnLabelFormat,
  type ColumnSettings,
  type ComboChartAxis,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  type XAxisConfig,
} from '@buster/server-shared/metrics';
import type { GridLineOptions, Scale, ScaleChartOptions, Tick, TimeScale } from 'chart.js';
import { Chart as ChartJS } from 'chart.js';
import isDate from 'lodash/isDate';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatLabel } from '@/lib/columnFormatter';
import { isNumericColumnType } from '@/lib/messages';
import { truncateText } from '@/lib/text';
import type { BusterChartProps } from '../../../../BusterChart.types';
import { useXAxisTitle } from '../axisHooks/useXAxisTitle';
import { useIsStacked } from '../useIsStacked';
import { AUTO_DATE_FORMATS } from './config';

export const useXAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  columnSettings,
  xAxisLabelRotation,
  xAxisShowAxisLabel,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  gridLines,
  lineGroupType,
  barGroupType,
  xAxisTimeInterval,
}: {
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  xAxisLabelRotation: NonNullable<BusterChartProps['xAxisLabelRotation']>;
  xAxisShowAxisLabel: NonNullable<BusterChartProps['xAxisShowAxisLabel']>;
  gridLines: NonNullable<BusterChartProps['gridLines']>;
  xAxisShowAxisTitle: BusterChartProps['xAxisShowAxisTitle'];
  xAxisAxisTitle: BusterChartProps['xAxisAxisTitle'];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  columnSettings: BusterChartProps['columnSettings'];
  xAxisTimeInterval: BusterChartProps['xAxisTimeInterval'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined => {
  const DEFAULT_X_AXIS_TICK_CALLBACK = ChartJS.defaults.scales.category?.ticks?.callback; //keep inside function to avoid initialization errors

  const isScatterChart = selectedChartType === 'scatter';
  const isPieChart = selectedChartType === 'pie';
  const isLineChart = selectedChartType === 'line';
  const isComboChart = selectedChartType === 'combo';
  const useGrid = isScatterChart;

  const isSupportedType = useMemo(() => {
    return !isPieChart;
  }, [isPieChart]);

  const xAxisColumnFormats: Record<string, ColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.x.reduce<Record<string, ColumnLabelFormat>>((acc, x) => {
      acc[x] = columnLabelFormats[x] || DEFAULT_COLUMN_LABEL_FORMAT;
      return acc;
    }, {});
  }, [selectedAxis.x, columnLabelFormats, isSupportedType]);

  const yAxisColumnSettings = useMemo(() => {
    if (!isSupportedType || !columnSettings) return {};

    return selectedAxis.y.reduce<Record<string, ColumnSettings>>((acc, x) => {
      acc[x] = columnSettings[x] || DEFAULT_COLUMN_SETTINGS;
      return acc;
    }, {});
  }, [selectedAxis.y, columnSettings]);

  const firstXColumnLabelFormat = useMemo(() => {
    if (isScatterChart) {
      return {
        ...xAxisColumnFormats[selectedAxis.x[0] || ''],
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      };
    }
    return xAxisColumnFormats[selectedAxis.x[0] || ''];
  }, [isScatterChart, xAxisColumnFormats, selectedAxis.x]);

  const stacked = useIsStacked({ selectedChartType, lineGroupType, barGroupType });

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: useGrid && gridLines,
      offset: true,
    } satisfies DeepPartial<GridLineOptions>;
  }, [gridLines, useGrid]);

  const type: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']['type']> = useMemo(() => {
    const xAxisKeys = Object.keys(xAxisColumnFormats);
    const xAxisKeysLength = xAxisKeys.length;

    if (xAxisKeysLength === 1) {
      const xIsDate = firstXColumnLabelFormat?.columnType === 'date';

      if ((isLineChart || isScatterChart) && xIsDate) {
        return 'time';
      }

      if (
        isComboChart &&
        columnSettings &&
        xIsDate &&
        //if there is a bar chart, we don't want to use time scale, it causes the bars to be cut off
        !Object.values(yAxisColumnSettings).some((y) => y.columnVisualization === 'bar')
      ) {
        const allYAxisKeys = [...selectedAxis.y, ...((selectedAxis as ComboChartAxis).y2 || [])];
        const atLeastOneLineVisualization = allYAxisKeys.some(
          (y) =>
            columnSettings[y]?.columnVisualization === 'line' ||
            columnSettings[y]?.columnVisualization === 'dot'
        );

        if (atLeastOneLineVisualization) return 'time';
      }
    }

    if (isScatterChart && xAxisKeysLength === 1) {
      const isNumeric = isNumericColumnType(firstXColumnLabelFormat?.columnType || 'text');
      if (isNumeric) return 'linear';
    }

    return 'category';
  }, [
    isScatterChart,
    isComboChart,
    isLineChart,
    columnSettings,
    xAxisColumnFormats,
    firstXColumnLabelFormat,
    selectedAxis,
  ]);

  const derivedTimeUnit = useMemo(() => {
    if (type !== 'time') return false;

    const fmt = firstXColumnLabelFormat?.dateFormat;
    if (!fmt || fmt === 'auto') return false;

    // look for patterns in your DATE_FORMATS keys
    if (/Y{2,4}/.test(fmt)) return 'year';
    if (/Q{1,4}/.test(fmt)) return 'quarter';
    if (/M{3,4}/.test(fmt)) return 'month';
    if (/D{1,2}/.test(fmt)) return 'day';
    if (/H{1,2}/.test(fmt)) return 'hour';
    // fall back
    return false;
  }, [firstXColumnLabelFormat]);

  const title = useXAxisTitle({
    xAxis: selectedAxis.x,
    columnLabelFormats,
    xAxisAxisTitle,
    xAxisShowAxisTitle,
    selectedAxis,
    isSupportedChartForAxisTitles: isSupportedType,
  });

  const customTickCallback = useMemoizedFn(function (
    this: Scale,
    value: string | number,
    index: number
  ) {
    const rawValue = this.getLabelForValue(value as number);

    if (type === 'time' || isDate(rawValue)) {
      const xColumnLabelFormat = firstXColumnLabelFormat;
      const isAutoFormat = xColumnLabelFormat?.dateFormat === 'auto';
      if (isAutoFormat) {
        const unit = (this.chart.scales.x as TimeScale)._unit as
          | 'millisecond'
          | 'second'
          | 'minute'
          | 'hour'
          | 'day'
          | 'week'
          | 'month'
          | 'quarter'
          | 'year';
        const format = AUTO_DATE_FORMATS[unit];
        return formatLabel(rawValue, { ...xColumnLabelFormat, dateFormat: format });
      }
      const res = formatLabel(rawValue, xColumnLabelFormat);
      return truncateText(res, 24);
    }

    if (isScatterChart) {
      //raw value does not work for scatter charts, it returns the value as a string
      return formatLabel(value, firstXColumnLabelFormat);
    }

    return DEFAULT_X_AXIS_TICK_CALLBACK.call(
      this,
      value,
      index,
      this.getLabels() as unknown as Tick[]
    );
  });

  const rotation = useMemo(() => {
    if (xAxisLabelRotation === 'auto' || xAxisLabelRotation === undefined) return undefined;
    return {
      maxRotation: xAxisLabelRotation,
      minRotation: xAxisLabelRotation,
    } satisfies DeepPartial<ScaleChartOptions<'bar'>['scales']['x']['ticks']>;
  }, [xAxisLabelRotation]);

  const timeUnit = useMemo(() => {
    if (type === 'time' && xAxisTimeInterval) {
      const arrayOfValidTimeUnits: XAxisConfig['xAxisTimeInterval'][] = [
        'day',
        'week',
        'month',
        'quarter',
        'year',
      ];
      const isValidTimeUnit = arrayOfValidTimeUnits.includes(xAxisTimeInterval);
      return isValidTimeUnit ? xAxisTimeInterval : false;
    }
    return derivedTimeUnit;
  }, [type, derivedTimeUnit, xAxisTimeInterval]);

  const offset = useMemo(() => {
    if (isScatterChart) return false;
    if (isLineChart) return lineGroupType !== 'percentage-stack';
    return true;
  }, [isScatterChart, isLineChart, lineGroupType]);

  const memoizedXAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined =
    useMemo(() => {
      if (isPieChart) return undefined;
      return {
        type,
        offset,
        title: {
          display: !!title,
          text: title,
        },
        stacked,
        time: {
          //consider writing a helper to FORCE a unit. Hours seems to be triggering more often than I would like...
          unit: xAxisTimeInterval ? xAxisTimeInterval : false,
        },
        ticks: {
          ...rotation,
          major: {
            enabled: false,
          },
          source: type === 'time' ? ('data' as const) : undefined,
          autoSkip: true,
          maxTicksLimit: type === 'time' ? (timeUnit === 'month' ? 18 : 18) : undefined,
          //  sampleSize: type === 'time' ? 28 : undefined, //DO NOT USE THIS. IT BREAK TIME SCALES
          display: xAxisShowAxisLabel,
          callback: customTickCallback,
          // @ts-expect-error - time is not type for some reason!
          time: {
            unit: timeUnit,
          },
          includeBounds: true,
        },
        grid,
      } satisfies DeepPartial<ScaleChartOptions<'bar'>['scales']['x']>;
    }, [
      timeUnit,
      offset,
      title,
      xAxisTimeInterval,
      isPieChart,
      customTickCallback,
      xAxisShowAxisLabel,
      stacked,
      type,
      grid,
      rotation,
    ]);

  return memoizedXAxisOptions;
};
