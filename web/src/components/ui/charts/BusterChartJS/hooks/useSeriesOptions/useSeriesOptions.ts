import type {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import {
  DatasetOption,
  DatasetOptionsWithTicks,
  extractFieldsFromChain
} from '../../../chartHooks';
import { ChartProps } from '../../core';
import type { ChartType as ChartJSChartType } from 'chart.js';
import { useMemo } from 'react';
import { pieSeriesBuilder_data, pieSeriesBuilder_labels } from './pieSeriesBuilder';
import { barSeriesBuilder, barSeriesBuilder_labels } from './barSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';
import { lineSeriesBuilder, lineSeriesBuilder_labels } from './lineSeriesBuilder';
import { scatterSeriesBuilder_data, scatterSeriesBuilder_labels } from './scatterSeriesBuilder';
import { defaultTooltipSeriesBuilder, scatterTooltipSeriesBuilder } from './tooltipSeriesBuilder';
import { comboSeriesBuilder_data, comboSeriesBuilder_labels } from './comboSeriesBuilder';
import type { ColumnMetaData } from '@/api/asset_interfaces/metric/interfaces';

export interface UseSeriesOptionsProps {
  selectedChartType: ChartType;
  y2AxisKeys: string[];
  yAxisKeys: string[];
  xAxisKeys: string[];
  categoryKeys: ScatterAxis['category'];
  tooltipKeys: string[];
  sizeKey: ScatterAxis['size'];
  columnSettings: NonNullable<BusterChartConfigProps['columnSettings']>;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  colors: string[];
  datasetOptions: DatasetOptionsWithTicks;
  scatterDotSize: BusterChartProps['scatterDotSize'];
  columnMetadata: ColumnMetaData[];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  trendlineSeries: ChartProps<'line'>['data']['datasets'][number][];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
}

export const useSeriesOptions = ({
  trendlineSeries,
  columnMetadata,
  selectedChartType,
  tooltipKeys,
  colors,
  yAxisKeys,
  y2AxisKeys,
  columnSettings,
  columnLabelFormats,
  datasetOptions,
  xAxisKeys,
  sizeKey,
  scatterDotSize,
  lineGroupType,
  categoryKeys,
  barShowTotalAtTop,
  barGroupType
}: UseSeriesOptionsProps): ChartProps<ChartJSChartType>['data'] => {
  const isScatter = selectedChartType === 'scatter';

  const labels: (string | Date)[] | undefined = useMemo(() => {
    return labelsBuilderRecord[selectedChartType]({
      datasetOptions,
      columnLabelFormats,
      xAxisKeys,
      sizeKey,
      columnSettings,
      trendlineSeries
    });
  }, [datasetOptions, columnSettings, columnLabelFormats, xAxisKeys, sizeKey]);

  const sizeOptions = useMemo(() => {
    if (!sizeKey || sizeKey.length === 0) {
      return null;
    }

    return null;
  }, [sizeKey]);

  const datasetSeries: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    return dataBuilderRecord[selectedChartType]({
      datasetOptions,
      columnSettings,
      colors,
      columnLabelFormats,
      xAxisKeys,
      scatterDotSize,
      sizeOptions,
      lineGroupType,
      categoryKeys,
      selectedChartType,
      barGroupType,
      barShowTotalAtTop,
      yAxisKeys,
      y2AxisKeys
    });
  }, [
    datasetOptions,
    columnSettings,
    yAxisKeys,
    y2AxisKeys,
    colors,
    columnLabelFormats,
    xAxisKeys,
    scatterDotSize,
    sizeOptions,
    lineGroupType,
    categoryKeys,
    selectedChartType,
    barGroupType,
    barShowTotalAtTop
  ]);

  const datasets: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    return [...datasetSeries, ...trendlineSeries];
  }, [datasetSeries, trendlineSeries]);

  return {
    labels,
    datasets
  };
};

export type LabelBuilderProps = {
  datasetOptions: DatasetOptionsWithTicks;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  xAxisKeys: ChartEncodes['x'];
  sizeKey: ScatterAxis['size'];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  trendlineSeries: ChartProps<'line'>['data']['datasets'][number][];
};

const labelsBuilderRecord: Record<
  ChartType,
  (props: LabelBuilderProps) => (string | Date)[] | undefined
> = {
  pie: pieSeriesBuilder_labels,
  bar: barSeriesBuilder_labels,
  line: lineSeriesBuilder_labels,
  scatter: scatterSeriesBuilder_labels,
  combo: comboSeriesBuilder_labels,
  metric: () => [],
  table: () => []
};

const dataBuilderRecord: Record<
  ChartType,
  (d: SeriesBuilderProps) => ChartProps<ChartJSChartType>['data']['datasets']
> = {
  pie: pieSeriesBuilder_data,
  bar: barSeriesBuilder,
  line: lineSeriesBuilder,
  scatter: scatterSeriesBuilder_data,
  combo: comboSeriesBuilder_data,
  //NOT USED
  metric: () => [],
  table: () => []
};
