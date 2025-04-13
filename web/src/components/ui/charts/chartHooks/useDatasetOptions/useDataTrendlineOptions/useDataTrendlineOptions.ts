import {
  BusterChartProps,
  type ChartEncodes,
  ChartType,
  type Trendline
} from '@/api/asset_interfaces/metric/charts';
import { useMemo } from 'react';
import last from 'lodash/last';
import { DatasetOption } from '../interfaces';
import { TrendlineDataset } from './trendlineDataset.types';
import { canSupportTrendlineRecord } from './canSupportTrendline';
import { trendlineDatasetCreator } from './trendlineDatasetCreator';
import { extractFieldsFromChain } from '../groupingHelpers';
import { isNumericColumnType } from '@/lib/messages';

export const useDataTrendlineOptions = ({
  datasetOptions,
  trendlines,
  selectedAxis,
  selectedChartType,
  columnLabelFormats
}: {
  datasetOptions: DatasetOption[] | undefined;
  trendlines: Trendline[] | undefined;
  selectedChartType: ChartType;
  selectedAxis: ChartEncodes;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}) => {
  const hasTrendlines = trendlines && trendlines.length > 0;

  const canSupportTrendlines: boolean = useMemo(() => {
    if (!hasTrendlines) return false;
    const isValidChartType =
      selectedChartType === ChartType.Line ||
      selectedChartType === ChartType.Bar ||
      selectedChartType === ChartType.Scatter ||
      selectedChartType === ChartType.Combo;

    return isValidChartType;
  }, [selectedChartType, hasTrendlines, selectedAxis, trendlines?.length]);

  const lastDataset = useMemo(() => {
    if (!datasetOptions || !canSupportTrendlines) return undefined;
    return last(datasetOptions);
  }, [datasetOptions, canSupportTrendlines]);
  const selectedDataset = useMemo(() => {
    if (!lastDataset) return undefined;
    const newDataset = { ...lastDataset };

    const newSource = [...(newDataset.source as Array<[string | number, ...number[]]>)];
    const sorted = newSource.sort((a, b) => {
      const aValue = a[0];
      const bValue = b[0];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const x = extractFieldsFromChain(aValue)[0];
        const y = extractFieldsFromChain(bValue)[0];
        const key = x.key;
        const value = x.value;
        const isNumeric = isNumericColumnType(columnLabelFormats[key]?.columnType!);
        if (isNumeric) {
          return parseFloat(value) - parseFloat(y.value);
        }
        return 0;
      }
      return 0;
    });
    return { ...newDataset, source: sorted };
  }, [lastDataset]);
  const datasetTrendlineOptions: TrendlineDataset[] = useMemo(() => {
    if (!hasTrendlines || !datasetOptions || !selectedDataset) return [] as TrendlineDataset[];

    const trendlineDatasets: TrendlineDataset[] = [];

    trendlines?.forEach((trendline) => {
      try {
        if (!canSupportTrendlineRecord[trendline.type](columnLabelFormats, trendline)) return;
        const trendlineDataset = trendlineDatasetCreator[trendline.type](
          trendline,
          selectedDataset,
          columnLabelFormats
        );

        trendlineDatasets.push(...trendlineDataset);
      } catch (error) {
        console.error(error);
      }
    });

    return trendlineDatasets;
  }, [selectedDataset, trendlines, hasTrendlines]);

  return datasetTrendlineOptions;
};
