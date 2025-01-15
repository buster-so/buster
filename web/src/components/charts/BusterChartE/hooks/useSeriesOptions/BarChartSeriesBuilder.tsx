import type { BarSeriesOption, DatasetComponentOption, LabelFormatterCallback } from 'echarts';
import {
  BusterChartProps,
  BarAndLineAxis,
  BusterChartConfigProps,
  ChartEncodes,
  ColumnLabelFormat
} from '../../../interfaces';
import { getYAxisColumnNames, seriesNameGenerator } from './helpers';
import { DEFAULT_BAR_ROUNDNESS } from '@/api/buster-rest';
import { formatLabel } from '@/utils';
import { labelContrastFormatter } from '../useEChartsTheme/buster_light_theme';
import { yAxisSimilar } from '@/components/charts/commonHelpers';

type MarkPointOption = BarSeriesOption['markPoint'];

export const BarChartSeriesBuilder = ({
  y,
  index,
  yAxisKeys,
  columnSettings,
  barLayout,
  columnLabelFormats,
  selectedAxis: selectedAxisProp,
  datasets,
  barGroupType,
  barShowTotalAtTop
}: {
  y: string;
  datasets: DatasetComponentOption[];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  barGroupType: NonNullable<BusterChartProps['barGroupType']>;
  selectedAxis: ChartEncodes;
  index: number;
  yAxisKeys: string[]; //this is the yAxisKeys array from the props
  columnSettings: NonNullable<BusterChartConfigProps['columnSettings']>;
  barLayout: NonNullable<BusterChartProps['barLayout']> | undefined;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
}): BarSeriesOption => {
  const selectedAxis = selectedAxisProp as BarAndLineAxis;
  const selectedDatasetIndex = datasets.length - 1;
  const lastDataset = datasets[datasets.length - 1];
  const dimensionNames = lastDataset.dimensions! as string[];
  const yAxisKeyIndex = dimensionNames.indexOf(y);
  const hasMultipleMeasures = selectedAxis.y.length > 1;
  const hasMultipleCategories = selectedAxis.category.length > 1;
  const hasCategoryAxis = selectedAxis.category.length >= 1;
  const isPercentageStack = barGroupType === 'percentage-stack';

  //Y AXIS SETTINGS
  const yAxisColumnNames = getYAxisColumnNames(y, selectedAxis.y);
  const firstColumnName = yAxisColumnNames[0];
  const isLastSeries = index === yAxisKeys.length - 1;
  const useHorizontalBar = barLayout === 'horizontal';

  const barSeries: BarSeriesOption = {
    name: seriesNameGenerator(y, hasMultipleMeasures, hasMultipleCategories),
    type: 'bar',
    datasetIndex: selectedDatasetIndex,
    encode: {
      x: useHorizontalBar ? y : 0,
      y: useHorizontalBar ? 0 : y
    }
  };

  //TODO: talk about this because technically you could have multi y axes that could stack
  if (barGroupType === 'stack' || isPercentageStack) {
    barSeries.stack = '🥞';
  }

  //DATA LABELS - STACKED TOTAL AT THE TOP
  if (
    barShowTotalAtTop &&
    isLastSeries &&
    barGroupType === 'stack' &&
    (hasMultipleMeasures || hasCategoryAxis)
  ) {
    //calculate the totals for the stack so that we can place them on top of the bars
    const stackTotals = calculateStackTotals(
      yAxisKeys,
      lastDataset,
      hasMultipleMeasures,
      hasCategoryAxis
    );

    const canUseSameYFormatter = hasMultipleMeasures
      ? yAxisSimilar(selectedAxis.y, columnLabelFormats)
      : true;

    const columnLabelFormat: ColumnLabelFormat = canUseSameYFormatter
      ? columnLabelFormats[firstColumnName]
      : { columnType: 'number', style: 'number' };

    const markPoints: MarkPointOption = {
      silent: true,
      symbol: 'rect',
      animation: false,
      label: {
        formatter: (v) => formatLabel(v.value as number, columnLabelFormat, false),
        distance: -20,
        position: 'top'
      },
      itemStyle: {
        color: 'transparent' //this will make the symbol transparent,
      },
      data: stackTotals.map((total, index) => ({
        value: total,
        xAxis: index,
        yAxis: total,
        name: 'Total' + index
      }))
    };

    barSeries.markPoint = markPoints;
  }

  //BAR ROUNDNESS
  const barRoundness = isPercentageStack
    ? 0
    : (columnSettings[firstColumnName]?.barRoundness ?? DEFAULT_BAR_ROUNDNESS);

  if (barSeries.stack) {
    if (isLastSeries) {
      setBarRoundness(barSeries, barRoundness, useHorizontalBar);
    }
  } else {
    setBarRoundness(barSeries, barRoundness, useHorizontalBar);
  }

  //DATA LABELS - INSIDE BAR
  const showDataLabels = columnSettings[firstColumnName]?.showDataLabels;
  const showDataLabelsAsPercentage = columnSettings[firstColumnName]?.showDataLabelsAsPercentage;
  const columnLabelFormat = columnLabelFormats[firstColumnName as string];
  let seriesTotalForPercentage = 0;

  if (showDataLabelsAsPercentage && !barSeries.stack) {
    const source = lastDataset.source as [string, ...number[]][];
    seriesTotalForPercentage = totalForSeries(source, yAxisKeyIndex);
  }

  barSeries.label = {
    show: showDataLabels,
    formatter: (params: Parameters<LabelFormatterCallback>[0]) => {
      const { encode, data, color } = params;
      let returnValue: string;

      //single series percentage
      if (isPercentageStack) {
        const value = (data as [string, ...number[]])[yAxisKeyIndex] as number;
        returnValue = formatLabel(value, { style: 'percent', columnType: 'number' }, false);
      } else if (showDataLabelsAsPercentage && !barSeries.stack) {
        const value = (data as [string, ...number[]])[yAxisKeyIndex] as number;
        const percentage = (value / seriesTotalForPercentage) * 100;
        returnValue = formatLabel(percentage, { style: 'percent', columnType: 'number' }, false);
      } else if (showDataLabelsAsPercentage && barSeries.stack) {
        const values = data as [string, ...number[]] as [string, ...number[]];
        const value = (data as [string, ...number[]])[yAxisKeyIndex] as number;
        const yAxisKeyIndices = yAxisKeys.map((yAxisKey) => dimensionNames.indexOf(yAxisKey));
        const stackTotal = yAxisKeyIndices.reduce<number>((acc, yAxisKeyIndex) => {
          const value = values[yAxisKeyIndex] as number;
          return acc + value;
        }, 0);
        const percentage = (value / stackTotal) * 100;
        returnValue = formatLabel(percentage, { style: 'percent', columnType: 'number' }, false);
      } else {
        const value = (data as [string, ...number[]])[encode!.y[0]];
        returnValue = formatLabel(value, columnLabelFormat, false);
      }

      return labelContrastFormatter(returnValue, color as string);
    }
  };

  return barSeries;
};

const setBarRoundness = (
  barSeries: BarSeriesOption,
  barRoundness: number,
  useHorizontalBar: boolean
) => {
  barSeries.itemStyle = {
    ...barSeries.itemStyle,
    borderRadius: useHorizontalBar
      ? [0, barRoundness, barRoundness, 0]
      : [barRoundness, barRoundness, 0, 0]
  };
};

const totalForSeries = (source: [string, ...number[]][], yAxisKeyIndex: number) => {
  return source.reduce<number>((acc, curr) => acc + Number(curr[yAxisKeyIndex]), 0);
};

const calculateStackTotals = (
  yAxisKeys: string[],
  selectedDataset: DatasetComponentOption,
  hasMultipleMeasures: boolean,
  hasCategoryAxis: boolean
): number[] => {
  const dimensionNames = selectedDataset.dimensions! as string[];
  const source = selectedDataset.source as [string, ...number[]][];

  const yAxisKeyIndices = yAxisKeys.map((yAxisKey) => dimensionNames.indexOf(yAxisKey));

  const stackTotals = source.map((row) => {
    return yAxisKeyIndices.reduce((acc, curr) => acc + Number(row[curr] || 0), 0);
  });

  return stackTotals;
};
