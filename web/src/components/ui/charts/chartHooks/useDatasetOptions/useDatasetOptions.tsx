'use client';

import { useMemo } from 'react';
import type {
  BusterChartConfigProps,
  BusterChartProps,
  ChartType,
  BarSortBy,
  ChartEncodes,
  ScatterAxis,
  Trendline,
  ComboChartAxis,
  IColumnLabelFormat,
  PieSortBy
} from '@/api/asset_interfaces/metric/charts';
import uniq from 'lodash/uniq';
import { sortLineBarData } from './datasetHelpers_BarLinePie';
import { downsampleAndSortScatterData } from './datasetHelpers_Scatter';
import { type TrendlineDataset, useDataTrendlineOptions } from './useDataTrendlineOptions';
import type { DatasetOptionsWithTicks } from './interfaces';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../../config';
import { aggregateAndCreateDatasets } from './aggregateAndCreateDatasets';
import { modifyDatasets } from './modifyDatasets';
import isEmpty from 'lodash/isEmpty';

type DatasetHookResult = {
  datasetOptions: DatasetOptionsWithTicks;
  dataTrendlineOptions: TrendlineDataset[];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  tooltipKeys: string[];
  hasMismatchedTooltipsAndMeasures: boolean;
  isDownsampled: boolean;
  numberOfDataPoints: number;
};

type DatasetHookParams = {
  data: NonNullable<BusterChartProps['data']>;
  barSortBy?: BarSortBy;
  pieSortBy?: PieSortBy;
  groupByMethod?: BusterChartProps['groupByMethod'];
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']> | undefined;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  barGroupType: BusterChartProps['barGroupType'] | undefined;
  lineGroupType: BusterChartProps['lineGroupType'];
  trendlines: Trendline[] | undefined;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
};

const defaultYAxis2 = [] as string[];

export const useDatasetOptions = (params: DatasetHookParams): DatasetHookResult => {
  const {
    selectedAxis,
    data,
    selectedChartType,
    barSortBy,
    columnLabelFormats,
    pieMinimumSlicePercentage,
    barGroupType,
    lineGroupType,
    trendlines,
    pieSortBy,
    columnMetadata
  } = params;
  const {
    x: xFields,
    y: yAxisFields,
    size: sizeField,
    tooltip: _tooltipFields = null,
    category: categoryFields = []
  } = selectedAxis as ScatterAxis;
  const { y2: y2AxisFields = defaultYAxis2 } = selectedAxis as ComboChartAxis;

  const tooltipFields = useMemo(() => _tooltipFields || [], [_tooltipFields]);

  const isPieChart = selectedChartType === 'pie';
  const isBarChart = selectedChartType === 'bar';
  const isScatter = selectedChartType === 'scatter';
  const isComboChart = selectedChartType === 'combo';

  const xFieldsString = useMemo(() => xFields.join(','), [xFields]);
  const yAxisFieldsString = useMemo(() => yAxisFields.join(','), [yAxisFields]);
  const y2AxisFieldsString = useMemo(() => y2AxisFields.join(','), [y2AxisFields]);
  const categoryFieldsString = useMemo(() => categoryFields.join(','), [categoryFields]);
  const sizeFieldString = useMemo(() => sizeField?.join(','), [sizeField]);
  const tooltipFieldsString = useMemo(() => tooltipFields.join(','), [tooltipFields]);

  const xFieldColumnLabelFormatColumnTypes: IColumnLabelFormat['columnType'][] = useMemo(() => {
    return xFields.map(
      (field) => columnLabelFormats[field]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
  }, [xFieldsString, columnLabelFormats]);

  //WILL ONLY BE USED FOR BAR AND PIE CHART
  const xFieldSorts = useMemo(() => {
    if (isPieChart) {
      if (pieSortBy === 'key') return xFieldColumnLabelFormatColumnTypes;
      return [];
    }

    if (isBarChart) {
      if (barSortBy && barSortBy?.some((y) => y !== 'none')) return [];
    }

    if (isScatter) {
      return [xFields[0]];
    }

    return xFieldColumnLabelFormatColumnTypes.filter((columnType) => columnType === 'date');
  }, [xFieldColumnLabelFormatColumnTypes, pieSortBy, isPieChart, isBarChart, isScatter, barSortBy]);

  const xFieldSortsString = useMemo(() => xFieldSorts.join(','), [xFieldSorts]);

  const measureFields: string[] = useMemo(() => {
    return uniq([...yAxisFields, ...y2AxisFields, ...tooltipFields]);
  }, [yAxisFieldsString, y2AxisFieldsString, tooltipFieldsString]);

  const isDownsampled = useMemo(() => {
    return data.length > DOWNSIZE_SAMPLE_THRESHOLD && isScatter;
  }, [data, isScatter]);

  const sortedAndLimitedData = useMemo(() => {
    if (isScatter) return downsampleAndSortScatterData(data, xFields[0]);
    return sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
  }, [data, xFieldSortsString, xFieldsString, isScatter]);

  const measureFieldsReplaceDataWithKey = useMemo(() => {
    return measureFields
      .map((field) => {
        const value = columnLabelFormats[field]?.replaceMissingDataWith;
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (value === '') return 'empty';
        return value;
      })
      .join(',');
  }, [measureFields.join(''), columnLabelFormats]);

  const yAxisKeys = useMemo(() => {
    return yAxisFields;
  }, [yAxisFieldsString]);

  const y2AxisKeys = useMemo(() => {
    if (!isComboChart) return defaultYAxis2;
    return y2AxisFields || defaultYAxis2;
  }, [y2AxisFieldsString, isComboChart]);

  const tooltipKeys = useMemo(() => {
    if (isEmpty(tooltipFields)) return [...measureFields];

    return tooltipFields;
  }, [tooltipFieldsString, measureFields]);

  const hasMismatchedTooltipsAndMeasures = useMemo(() => {
    const allYAxis = [...yAxisFields, ...y2AxisFields];
    if (tooltipFields.length === 0) return false;
    return tooltipFields.some((yAxis) => {
      return !allYAxis.includes(yAxis);
    });
  }, [yAxisFieldsString, y2AxisFieldsString, tooltipFieldsString]);

  const aggregatedDatasets = useMemo(() => {
    return aggregateAndCreateDatasets(
      sortedAndLimitedData,
      {
        x: xFields,
        y: yAxisFields,
        y2: y2AxisFields,
        category: categoryFields,
        size: sizeField,
        tooltip: tooltipFields
      },
      columnLabelFormats,
      isScatter
    );
  }, [
    sortedAndLimitedData,
    xFieldsString,
    yAxisFieldsString,
    y2AxisFieldsString,
    categoryFieldsString,
    sizeFieldString,
    tooltipFieldsString,
    measureFieldsReplaceDataWithKey,
    isScatter
  ]);

  const datasetOptions = useMemo(() => {
    return modifyDatasets({
      datasets: aggregatedDatasets,
      pieMinimumSlicePercentage,
      pieSortBy,
      barSortBy,
      barGroupType,
      lineGroupType,
      selectedChartType
    });
  }, [
    aggregatedDatasets,
    pieMinimumSlicePercentage,
    pieSortBy,
    barSortBy,
    barGroupType,
    lineGroupType,
    selectedChartType
  ]);

  const dataTrendlineOptions = useDataTrendlineOptions({
    datasetOptions,
    trendlines,
    selectedAxis,
    selectedChartType,
    columnLabelFormats
  });

  const numberOfDataPoints = useMemo(() => {
    return datasetOptions.datasets.reduce((acc, dataset) => acc + dataset.data.length, 0);
  }, [datasetOptions]);

  return {
    numberOfDataPoints,
    datasetOptions,
    dataTrendlineOptions,
    yAxisKeys,
    y2AxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures,
    isDownsampled
  };
};
