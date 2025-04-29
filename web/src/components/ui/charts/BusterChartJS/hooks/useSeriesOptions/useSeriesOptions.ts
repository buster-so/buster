import type {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes,
  ChartType,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import { DatasetOption, extractFieldsFromChain } from '../../../chartHooks';
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
  datasetOptions: DatasetOption[];
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

  const selectedDataset = useMemo(() => {
    return datasetOptions[datasetOptions.length - 1];
  }, [datasetOptions, selectedChartType]);

  const allYAxisKeysIndexes = useMemo(() => {
    return yAxisKeys
      .map((key) => {
        return {
          name: key,
          index: selectedDataset.dimensions.findIndex((dimension) => dimension === key)
        };
      })
      .filter((item) => item.index !== -1);
  }, [yAxisKeys.join(','), selectedDataset.dimensions]);

  console.log('allYAxisKeysIndexes', allYAxisKeysIndexes, yAxisKeys);

  const allY2AxisKeysIndexes = useMemo(() => {
    return y2AxisKeys
      .map((key) => {
        return {
          name: key,
          index: selectedDataset.dimensions.findIndex((dimension) => dimension === key)
        };
      })
      .filter((item) => item.index !== -1);
  }, [y2AxisKeys.join(','), selectedDataset.dimensions]);

  const sizeKeyIndex = useMemo(() => {
    if (!sizeKey || sizeKey.length === 0) {
      return null;
    }
    const size = sizeKey[0];
    const index = selectedDataset.dimensions.findIndex((dimension) => {
      const chain = extractFieldsFromChain(dimension);
      return chain.some((item) => item.key === size);
    });
    if (index === -1) return null;

    const assosciatedColumnMetadata = columnMetadata.find((item) => item.name === size);

    if (!assosciatedColumnMetadata) {
      console.warn(`Column metadata not found for size key: ${size}`);
      return {
        name: size,
        index,
        minValue: 0,
        maxValue: 10
      };
    }

    return {
      name: size,
      index,
      minValue: assosciatedColumnMetadata.min_value as number,
      maxValue: assosciatedColumnMetadata.max_value as number
    };
  }, [sizeKey?.join(','), selectedDataset.dimensions]);

  const labels: (string | Date)[] | undefined = useMemo(() => {
    return labelsBuilderRecord[selectedChartType]({
      dataset: selectedDataset,
      allYAxisKeysIndexes,
      allY2AxisKeysIndexes,
      columnLabelFormats,
      xAxisKeys,
      sizeKey,
      columnSettings,
      trendlineSeries
    });
  }, [
    selectedDataset,
    columnSettings,
    allYAxisKeysIndexes,
    columnLabelFormats,
    xAxisKeys,
    sizeKey
  ]);

  const datasetSeries: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    return dataBuilderRecord[selectedChartType]({
      selectedDataset,
      allYAxisKeysIndexes,
      allY2AxisKeysIndexes,
      columnSettings,
      colors,
      barShowTotalAtTop,
      columnLabelFormats,
      xAxisKeys,
      sizeKeyIndex,
      scatterDotSize,
      lineGroupType,
      categoryKeys,
      selectedChartType,
      barGroupType
    });
  }, [
    selectedDataset,
    allYAxisKeysIndexes,
    allY2AxisKeysIndexes,
    columnSettings,
    colors,
    barShowTotalAtTop,
    columnLabelFormats,
    xAxisKeys,
    sizeKeyIndex,
    scatterDotSize,
    lineGroupType,
    categoryKeys,
    selectedChartType
  ]);

  console.log('datasetSeries', datasetSeries);

  const tooltipSeries: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    if (isScatter) {
      return scatterTooltipSeriesBuilder({
        datasetOptions,
        tooltipKeys
      });
    }
    const series = defaultTooltipSeriesBuilder({
      datasetOptions,
      tooltipKeys
    });
    return series;
  }, [tooltipKeys, datasetOptions, isScatter]);

  const datasets: ChartProps<ChartJSChartType>['data']['datasets'] = useMemo(() => {
    return [...datasetSeries, ...tooltipSeries, ...trendlineSeries];
  }, [datasetSeries, tooltipSeries, trendlineSeries]);

  return {
    labels,
    datasets
  };
};

export type LabelBuilderProps = {
  dataset: DatasetOption;
  allYAxisKeysIndexes: {
    name: string;
    index: number;
  }[];
  allY2AxisKeysIndexes: {
    name: string;
    index: number;
  }[];
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
