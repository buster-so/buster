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
import {
  getLineBarPieDatasetOptions,
  getLineBarPieDimensions,
  getLineBarPieTooltipKeys,
  getLineBarPieYAxisKeys,
  mapLineBarPieData,
  processLineBarData,
  sortLineBarData
} from './datasetHelpers_BarLinePie';
import {
  downsampleScatterData,
  getScatterDatasetOptions,
  getScatterDimensions,
  getScatterTooltipKeys,
  mapScatterData,
  processScatterData
} from './datasetHelpers_Scatter';
import { type TrendlineDataset, useDataTrendlineOptions } from './useDataTrendlineOptions';
import type { DatasetOption } from './interfaces';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../../config';
import { appendToKeyValueChain } from './groupingHelpers';
import { aggregateBasedOnXAndCategory } from './aggregateBasedOnXAndCategory';

type DatasetHookResult = {
  datasetOptions: DatasetOption[];
  dataTrendlineOptions: TrendlineDataset[];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  tooltipKeys: string[];
  hasMismatchedTooltipsAndMeasures: boolean;
  isDownsampled: boolean;
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
  const xAxisField = xFields[0];

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
    if (isScatter) return downsampleScatterData(data);
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

  //DONE UP TO HERE

  const combinedData = useMemo(() => {
    return aggregateBasedOnXAndCategory(
      sortedAndLimitedData,
      xFields,
      measureFields,
      categoryFields,
      isScatter,
      columnLabelFormats
    );
  }, [
    sortedAndLimitedData,
    xFieldsString,
    categoryFieldsString,
    yAxisFieldsString,
    y2AxisFieldsString,
    isScatter,
    measureFieldsReplaceDataWithKey
  ]);

  console.log('combinedData', combinedData);

  const processedData = useMemo(() => {
    if (isScatter) {
      return processScatterData(
        sortedAndLimitedData,
        xAxisField,
        measureFields,
        categoryFields,
        sizeField,
        tooltipFields,
        columnLabelFormats
      );
    }

    return processLineBarData(
      categoriesSet,
      xValuesSet,
      dataMap,
      measureFields,
      columnLabelFormats
    );
  }, [
    tooltipFields,
    sortedAndLimitedData,
    xFieldSortsString,
    xFieldsString,
    isScatter,
    categoriesSet,
    xValuesSet,
    dataMap,
    measureFields,
    sizeFieldString,
    dimensions,
    measureFieldsReplaceDataWithKey //use this instead of columnLabelFormats
  ]);

  console.log('processedData', processedData);

  const yAxisKeys = useMemo(() => {
    if (isScatter)
      return yAxisFields.map((field) => appendToKeyValueChain([{ key: field, value: null }])); //not a typo. I want to use the same function for both scatter and bar/line/pie
    return getLineBarPieYAxisKeys(categoriesSet, yAxisFields);
  }, [categoriesSet, yAxisFieldsString, isScatter]);

  console.log('yAxisKeys', yAxisKeys);

  const y2AxisKeys = useMemo(() => {
    if (!isComboChart) return defaultYAxis2;
    return getLineBarPieYAxisKeys(categoriesSet, y2AxisFields);
  }, [categoriesSet, y2AxisFieldsString, isComboChart]);

  const tooltipKeys = useMemo(() => {
    if (isScatter) {
      return getScatterTooltipKeys(
        tooltipFields,
        xAxisField,
        categoryFields,
        measureFields,
        sizeField
      );
    }
    return getLineBarPieTooltipKeys(categoriesSet, tooltipFields, measureFields);
  }, [categoryFieldsString, tooltipFieldsString, xAxisField, sizeFieldString, isScatter]);

  const hasMismatchedTooltipsAndMeasures = useMemo(() => {
    const allYAxis = [...yAxisFields, ...y2AxisFields];
    if (tooltipFields.length === 0) return false;
    return tooltipFields.some((yAxis) => {
      return !allYAxis.includes(yAxis);
    });
  }, [yAxisFields, y2AxisFields, tooltipFieldsString]);

  const datasetOptions = useMemo(() => {
    if (isScatter) {
      return getScatterDatasetOptions(processedData, dimensions);
    }

    return getLineBarPieDatasetOptions(
      dimensions,
      processedData as (string | number | Date | null)[][],
      selectedChartType,
      pieMinimumSlicePercentage,
      barSortBy,
      pieSortBy,
      yAxisKeys,
      xFieldSorts,
      barGroupType,
      lineGroupType
    );
  }, [
    lineGroupType,
    barGroupType,
    processedData,
    dimensions,
    yAxisKeys,
    barSortBy,
    pieSortBy,
    pieMinimumSlicePercentage,
    measureFields,
    isScatter,
    selectedChartType
  ]);

  const dataTrendlineOptions = useDataTrendlineOptions({
    datasetOptions,
    trendlines,
    selectedAxis,
    selectedChartType,
    columnLabelFormats
  });

  return {
    datasetOptions, //this is a matrix of dimensions x measures
    dataTrendlineOptions,
    yAxisKeys,
    y2AxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures,
    isDownsampled
  };
};
