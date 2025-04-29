import type { ChartProps } from '../../core';
import { LabelBuilderProps } from './useSeriesOptions';
import { formatChartLabelDelimiter, formatLabelForDataset } from '../../../commonHelpers';
import { SeriesBuilderProps } from './interfaces';
import { formatLabel } from '@/lib';

type PieSerieType =
  | ChartProps<'pie'>['data']['datasets'][number]
  | ChartProps<'doughnut'>['data']['datasets'][number];

export const pieSeriesBuilder_data = ({
  datasetOptions,
  colors,
  columnLabelFormats
}: SeriesBuilderProps): PieSerieType[] => {
  console.log(datasetOptions);
  return datasetOptions.datasets.map<PieSerieType>((dataset) => {
    return {
      xAxisKeys: [],
      label: formatLabelForDataset(dataset, columnLabelFormats),
      backgroundColor: colors,
      //pie will only have one dataset
      data: dataset.data,
      borderColor: 'white', //I tried to set this globally in the theme but it didn't work
      tooltipData: dataset.tooltipData
    };
  });
};

export const pieSeriesBuilder_labels = ({
  datasetOptions,
  xAxisKeys,
  columnLabelFormats
}: LabelBuilderProps) => {
  const { ticks, ticksKey } = datasetOptions;
  return ticks.flatMap((item) => {
    return item.map<string>((item, index) => {
      const key = ticksKey[index]?.key;
      const columnLabelFormat = columnLabelFormats[key];
      return formatLabel(item, columnLabelFormat);
    });
  });
};
