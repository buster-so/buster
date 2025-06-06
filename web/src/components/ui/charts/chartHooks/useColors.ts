import { useMemo } from 'react';
import { ChartType } from '@/api/asset_interfaces/metric';
import type { DatasetOption } from './useDatasetOptions';

export const useColors = ({
  colors: colorsProp,
  yAxisKeys,
  y2AxisKeys,
  selectedChartType,
  datasetOptions
}: {
  colors: string[];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  datasetOptions: DatasetOption[];
  selectedChartType: ChartType;
}) => {
  const numberOfYAxisKeys = yAxisKeys.length;
  const numberOfY2AxisKeys = y2AxisKeys.length;
  const totalNumberOfKeys = numberOfYAxisKeys + numberOfY2AxisKeys;
  const sourceLength = datasetOptions[0].data.length;
  const isScatter = selectedChartType === ChartType.Scatter;

  const colors: string[] = useMemo(() => {
    if (isScatter) {
      return colorsProp;
    }

    return Array.from(
      { length: totalNumberOfKeys * sourceLength },
      (_, i) => colorsProp[i % colorsProp.length]
    );
  }, [colorsProp, totalNumberOfKeys, isScatter]);

  return colors;
};
