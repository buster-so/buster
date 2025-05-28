import type { ChartProps } from '../../core';
import type { LabelBuilderProps } from './useSeriesOptions';
import { formatLabelForDataset, JOIN_CHARACTER } from '../../../commonHelpers';
import type { SeriesBuilderProps } from './interfaces';
import { formatLabel } from '@/lib';

type PieSerieType =
  | ChartProps<'pie'>['data']['datasets'][number]
  | ChartProps<'doughnut'>['data']['datasets'][number];

export const pieSeriesBuilder_data = ({
  datasetOptions,
  colors,
  xAxisKeys,
  columnLabelFormats
}: SeriesBuilderProps): PieSerieType[] => {
  return datasetOptions.datasets.map<PieSerieType>((dataset) => {
    return {
      label: formatLabelForDataset(dataset, columnLabelFormats),
      backgroundColor: colors,
      xAxisKeys,
      yAxisKey: dataset.dataKey,
      data: dataset.data as number[],
      borderColor: 'white', //I tried to set this globally in the theme but it didn't work
      tooltipData: dataset.tooltipData
    };
  });
};

export const pieSeriesBuilder_labels = ({
  datasetOptions,
  columnLabelFormats
}: LabelBuilderProps) => {
  const { ticks, ticksKey } = datasetOptions;
  return ticks.flatMap((item) => {
    return item
      .map<string>((item, index) => {
        const key = ticksKey[index]?.key;
        const columnLabelFormat = columnLabelFormats[key];
        return formatLabel(item, columnLabelFormat);
      })
      .join(JOIN_CHARACTER);
  });
};
