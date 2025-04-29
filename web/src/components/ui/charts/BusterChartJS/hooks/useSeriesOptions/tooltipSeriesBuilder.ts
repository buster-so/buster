import { extractFieldsFromChain, type DatasetOption } from '../../../chartHooks';
import type { ChartProps } from '../../core/types';
import type { ChartType as ChartJSChartType } from 'chart.js';

export const defaultTooltipSeriesBuilder = ({
  datasetOptions,
  tooltipKeys
}: {
  datasetOptions: DatasetOption[];
  tooltipKeys: string[];
}): ChartProps<ChartJSChartType>['data']['datasets'] => {
  const selectedDataset = datasetOptions.at(-1)!;
  const tooltipSeries: ChartProps<ChartJSChartType>['data']['datasets'] = [];

  tooltipKeys.forEach((tooltipKey) => {
    const indexOfKey = selectedDataset.dimensions.indexOf(tooltipKey);
    tooltipSeries.push({
      hidden: true,
      label: tooltipKey,
      data: selectedDataset.source.map((item) => item[indexOfKey] as number)
    });
  });

  return tooltipSeries;
};

export const scatterTooltipSeriesBuilder = ({
  datasetOptions,
  tooltipKeys
}: {
  datasetOptions: DatasetOption[];
  tooltipKeys: string[];
}) => {
  const tooltipSeries: ChartProps<ChartJSChartType>['data']['datasets'] = [];
  const selectedDataset = datasetOptions.at(-1)!;
  const selectedDatasetSource = selectedDataset.source.reduce<(string | number)[][]>(
    (acc, item) => {
      const noNullValues = item.filter((value) => value !== null && value !== undefined) as (
        | string
        | number
      )[];
      acc.push(noNullValues);
      return acc;
    },
    []
  );
  console.log('selectedDatasetSource', selectedDatasetSource);
  let xIndexTracker = 0;

  const getIndexOfRow = (key: string) => {
    const index = selectedDataset.dimensions.indexOf(key);
    if (index === -1) {
      const row = selectedDatasetSource[xIndexTracker];
      const firstItemInRow = row[0];
      const extracted = extractFieldsFromChain(key);

      if (xIndexTracker < 10) {
        console.log(key, extracted, xIndexTracker, firstItemInRow);
      }

      xIndexTracker++;
      if (firstItemInRow === null) {
        console.log('firstItemInRow is null', row);
      }

      return xIndexTracker - 1;
    }
    return index;
  };

  const getIndexOfKey = (key: string, tkIndex: number) => {
    const index = selectedDataset.dimensions.indexOf(key);

    if (index === -1) {
      return 0;
    }
    return index;
  };

  console.log('tooltipKeys', tooltipKeys);

  tooltipKeys.forEach((tooltipKey, tkIndex) => {
    const indexOfKey = getIndexOfKey(tooltipKey, tkIndex);

    tooltipSeries.push({
      hidden: true,
      label: tooltipKey,
      data: selectedDatasetSource.map((item) => item[indexOfKey] as number)
    });
  });

  console.log('tooltipSeries', tooltipSeries);

  return tooltipSeries;
};
