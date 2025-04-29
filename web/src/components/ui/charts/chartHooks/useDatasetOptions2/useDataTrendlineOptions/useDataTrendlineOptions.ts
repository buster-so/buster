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

  const datasetTrendlineOptions: TrendlineDataset[] = useMemo(() => {
    if (!canSupportTrendlines || !hasTrendlines || !datasetOptions || !datasetOptions.length)
      return [] as TrendlineDataset[];

    const trendlineDatasets: TrendlineDataset[] = [];

    trendlines?.forEach((trendline) => {
      try {
        if (!canSupportTrendlineRecord[trendline.type](columnLabelFormats, trendline)) return;
        const trendlineDataset = trendlineDatasetCreator[trendline.type](
          trendline,
          datasetOptions,
          columnLabelFormats
        );

        trendlineDatasets.push(...trendlineDataset);
      } catch (error) {
        console.error(error);
      }
    });

    return trendlineDatasets;
  }, [datasetOptions, canSupportTrendlines, trendlines, hasTrendlines]);

  return datasetTrendlineOptions;
};
