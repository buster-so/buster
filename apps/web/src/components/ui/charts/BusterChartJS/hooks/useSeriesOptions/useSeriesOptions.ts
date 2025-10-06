import type {
  ChartConfigProps,
  ChartEncodes,
  ChartType,
  ColumnMetaData,
  ScatterAxis,
} from '@buster/server-shared/metrics';
import type { ChartType as ChartJSChartType } from 'chart.js';
import { useMemo } from 'react';
import { isNumericColumnType } from '@/lib/messages';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOptionsWithTicks } from '../../../chartHooks';
import type { ChartProps } from '../../core';
import { barSeriesBuilder, barSeriesBuilder_labels } from './barSeriesBuilder';
import { comboSeriesBuilder_data, comboSeriesBuilder_labels } from './comboSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';
import { lineSeriesBuilder, lineSeriesBuilder_labels } from './lineSeriesBuilder';
import { pieSeriesBuilder_data, pieSeriesBuilder_labels } from './pieSeriesBuilder';
import { scatterSeriesBuilder_data, scatterSeriesBuilder_labels } from './scatterSeriesBuilder';

export interface UseSeriesOptionsProps {
  selectedChartType: ChartType;
  y2AxisKeys: string[];
  yAxisKeys: string[];
  xAxisKeys: string[];
  sizeKey: ScatterAxis['size'];
  columnSettings: NonNullable<ChartConfigProps['columnSettings']>;
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
  colors: string[];
  datasetOptions: DatasetOptionsWithTicks;
  scatterDotSize: BusterChartProps['scatterDotSize'];
  columnMetadata: ColumnMetaData[];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  trendlines: BusterChartProps['trendlines'];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
}

export const useSeriesOptions = ({
  columnMetadata,
  selectedChartType,
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
  barShowTotalAtTop,
  barGroupType,
  trendlines,
}: UseSeriesOptionsProps): ChartProps<ChartJSChartType>['data'] => {
  const labels: (string | Date | number)[] | undefined = useMemo(() => {
    return labelsBuilderRecord[selectedChartType]({
      datasetOptions,
      columnLabelFormats,
      xAxisKeys,
      sizeKey,
      columnSettings,
    });
  }, [datasetOptions, columnSettings, columnLabelFormats, xAxisKeys, sizeKey, selectedChartType]);

  const sizeOptions: SeriesBuilderProps['sizeOptions'] = useMemo(() => {
    if (!sizeKey || sizeKey.length === 0) {
      return null;
    }

    const assosciatedColumn = columnMetadata.find((meta) => meta.name === sizeKey[0]);
    const isNumberColumn = assosciatedColumn && isNumericColumnType(assosciatedColumn?.simple_type);

    if (!isNumberColumn) {
      console.warn('Size key is not a number column', { isNumberColumn, sizeKey });
      return null;
    }

    return {
      key: sizeKey[0],
      minValue: Number(assosciatedColumn?.min_value),
      maxValue: Number(assosciatedColumn?.max_value),
    };
  }, [sizeKey, columnMetadata]);

  const datasets: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    return dataBuilderRecord[selectedChartType]({
      datasetOptions,
      columnSettings,
      colors,
      columnLabelFormats,
      xAxisKeys,
      scatterDotSize,
      sizeOptions,
      lineGroupType,
      barGroupType,
      barShowTotalAtTop,
      yAxisKeys,
      y2AxisKeys,
      trendlines,
    });
  }, [
    trendlines,
    datasetOptions,
    columnSettings,
    colors,
    columnLabelFormats,
    xAxisKeys,
    scatterDotSize,
    sizeOptions,
    lineGroupType,
    barGroupType,
    barShowTotalAtTop,
    yAxisKeys,
    y2AxisKeys,
    selectedChartType,
  ]);

  return {
    labels,
    datasets,
  };
};

export type LabelBuilderProps = {
  datasetOptions: DatasetOptionsWithTicks;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  xAxisKeys: ChartEncodes['x'];
  sizeKey: ScatterAxis['size'];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  trendlineSeries?: Array<{ yAxisKey: string }>;
};

const labelsBuilderRecord: Record<
  ChartType,
  (props: LabelBuilderProps) => (string | Date | number)[] | undefined
> = {
  pie: pieSeriesBuilder_labels,
  bar: barSeriesBuilder_labels,
  line: lineSeriesBuilder_labels,
  scatter: scatterSeriesBuilder_labels,
  combo: comboSeriesBuilder_labels,
  metric: () => [],
  table: () => [],
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
  table: () => [],
};
