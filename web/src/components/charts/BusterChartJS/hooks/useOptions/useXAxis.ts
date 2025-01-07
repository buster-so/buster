import {
  BusterChartConfigProps,
  ChartEncodes,
  ChartType,
  BusterChartProps,
  IColumnLabelFormat,
  ComboChartAxis
} from '@/components/charts/interfaces';
import { useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
import { DeepPartial } from 'utility-types';
import type { ScaleChartOptions, Scale, GridLineOptions } from 'chart.js';
import { useXAxisTitle } from '@/components/charts/commonHelpers/useXAxisTitle';
import { useIsStacked } from './useIsStacked';
import { formatLabel, isNumericColumnType } from '@/utils';
import isDate from 'lodash/isDate';

export const useXAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  columnMetadata,
  columnSettings,
  xAxisLabelRotation,
  xAxisShowAxisLabel,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  gridLines,
  lineGroupType,
  barGroupType
}: {
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  xAxisLabelRotation: NonNullable<BusterChartProps['xAxisLabelRotation']>;
  xAxisShowAxisLabel: NonNullable<BusterChartProps['xAxisShowAxisLabel']>;
  gridLines: NonNullable<BusterChartProps['gridLines']>;
  xAxisShowAxisTitle: BusterChartProps['xAxisShowAxisTitle'];
  xAxisAxisTitle: BusterChartProps['xAxisAxisTitle'];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  columnSettings: BusterChartProps['columnSettings'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined => {
  const isScatterChart = selectedChartType === ChartType.Scatter;
  const isPieChart = selectedChartType === ChartType.Pie;
  const useGrid = isScatterChart;

  const isSupportedType = useMemo(() => {
    return !isPieChart;
  }, [isPieChart]);

  const xAxisColumnFormats: Record<string, IColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.x.reduce<Record<string, IColumnLabelFormat>>((acc, x) => {
      acc[x] = columnLabelFormats[x];
      return acc;
    }, {});
  }, [selectedAxis.x, columnLabelFormats, isSupportedType]);

  const stacked = useIsStacked({ selectedChartType, lineGroupType, barGroupType });

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: useGrid && gridLines,
      offset: true
    };
  }, [gridLines, useGrid]);

  const type: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']['type']> = useMemo(() => {
    const xAxisKeys = Object.keys(xAxisColumnFormats);
    const xAxisKeysLength = xAxisKeys.length;
    const firstXKey = xAxisKeys[0];

    if (xAxisKeysLength === 1) {
      const xIsDate = xAxisColumnFormats[firstXKey].columnType === 'date';

      if (
        (selectedChartType === ChartType.Line || selectedChartType === ChartType.Scatter) &&
        xIsDate
      ) {
        return 'time';
      }

      if (selectedChartType === ChartType.Combo && columnSettings) {
        const allYAxisKeys = [...selectedAxis.y, ...((selectedAxis as ComboChartAxis).y2 || [])];
        const atLeastOneLineVisualization = allYAxisKeys.some(
          (y) =>
            columnSettings[y].columnVisualization === 'line' ||
            columnSettings[y].columnVisualization === 'dot'
        );

        if (atLeastOneLineVisualization) return 'time';
      }
    }

    if (isScatterChart && xAxisKeysLength === 1) {
      const isNumeric = isNumericColumnType(xAxisColumnFormats[firstXKey]?.columnType);
      if (isNumeric) return 'linear';
    }

    return 'category';
  }, [isScatterChart, columnSettings, xAxisColumnFormats]);

  const title = useXAxisTitle({
    xAxis: selectedAxis.x,
    columnLabelFormats,
    xAxisAxisTitle,
    xAxisShowAxisTitle,
    selectedAxis,
    isSupportedChartForAxisTitles: isSupportedType
  });

  const useTicketCallback = useMemo(() => {
    if (type === 'time') {
      const isSingleXAxis = selectedAxis.x.length === 1;
      const columnLabelFormat = xAxisColumnFormats[selectedAxis.x[0]];
      const isDate = columnLabelFormat?.columnType === 'date';
      const isAutoDate = columnLabelFormat?.dateFormat === 'auto' || !columnLabelFormat?.dateFormat;
      return !(isSingleXAxis && isDate && isAutoDate);
    }
    return true;
  }, [type, selectedAxis.x, xAxisColumnFormats]);

  const tickCallback = useMemoizedFn(function (this: Scale, value: string | number, index: number) {
    const rawValue = this.getLabelForValue(value as number);

    if (type === 'time' || isDate(rawValue)) {
      const xKey = selectedAxis.x[0];
      const xColumnLabelFormat = xAxisColumnFormats[xKey];
      const res = formatLabel(rawValue, xColumnLabelFormat);
      return res;
    }

    return rawValue;
  });

  const rotation = useMemo(() => {
    if (xAxisLabelRotation === 'auto' || xAxisLabelRotation === undefined) return undefined;
    return {
      maxRotation: xAxisLabelRotation,
      minRotation: xAxisLabelRotation
    };
  }, [xAxisLabelRotation]);

  const memoizedXAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined =
    useMemo(() => {
      if (isPieChart) return undefined;

      return {
        type,
        offset: !isScatterChart,
        title: {
          display: !!title,
          text: title
        },
        stacked,
        ticks: {
          ...rotation,
          display: xAxisShowAxisLabel,
          callback: useTicketCallback ? tickCallback : null,
          autoSkip: true,
          autoSkipPadding: 3,
          align: 'center'
        },
        display: true,
        border: {
          display: true
        },
        grid
      } as DeepPartial<ScaleChartOptions<'bar'>['scales']['x']>;
    }, [
      title,
      isScatterChart,
      isPieChart,
      useTicketCallback,
      xAxisShowAxisLabel,
      stacked,
      type,
      grid,
      rotation,
      tickCallback
    ]);

  return memoizedXAxisOptions;
};
