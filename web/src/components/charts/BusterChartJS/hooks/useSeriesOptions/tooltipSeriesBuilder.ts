import type { DatasetOption } from '@/components/charts/chartHooks';
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

  const getIndexOfKey = (key: string) => {
    const index = selectedDataset.dimensions.indexOf(key);
    if (index === -1) {
      return 0; //if there is no index, we can samely use the first index because the tooltip is not a measure
    }
    return index;
  };

  tooltipKeys.forEach((tooltipKey) => {
    const indexOfKey = getIndexOfKey(tooltipKey);
    tooltipSeries.push({
      hidden: true,
      label: tooltipKey,
      data: selectedDataset.source.map((item) => item[indexOfKey] as number)
    });
  });

  return tooltipSeries;
};
