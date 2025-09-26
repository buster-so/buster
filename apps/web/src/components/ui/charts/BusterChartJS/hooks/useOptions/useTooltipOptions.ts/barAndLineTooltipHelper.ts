import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { Chart, ChartTypeRegistry, TooltipItem } from 'chart.js';
import { formatLabel } from '@/lib/columnFormatter';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';
import { getPercentage } from './helpers';

export const barAndLineTooltipHelper = (
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  chart: Chart,
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>,
  keyToUsePercentage: string[],
  hasMultipleShownDatasets: boolean,
  percentageMode: undefined | 'stacked'
): ITooltipItem[] => {
  if (percentageMode) {
    dataPoints.reverse(); //we do this because the data points are in reverse order and it looks better
  }

  const tooltipItems = dataPoints.flatMap<ITooltipItem>((dataPoint) => {
    const tooltipDataset = dataPoint.dataset;
    const dataPointDataIndex = dataPoint.dataIndex;
    const tooltipData = tooltipDataset.tooltipData;
    const selectedToolTipData = tooltipData[dataPointDataIndex];

    if (!selectedToolTipData) return [];

    return selectedToolTipData.map<ITooltipItem>((item) => {
      const colorItem = tooltipDataset?.backgroundColor as string;
      const color =
        tooltipDataset && tooltipDataset.yAxisKey === item.key //we want to use the default gray color if the y axis key is the same as the item key (which means it is plotted)
          ? typeof colorItem === 'function'
            ? (tooltipDataset?.borderColor as string)
            : (tooltipDataset?.backgroundColor as string)
          : undefined;
      const usePercentage =
        !!percentageMode || keyToUsePercentage.includes(tooltipDataset.label as string);

      const formattedLabel = hasMultipleShownDatasets
        ? tooltipDataset.label || ''
        : formatLabel(item.key, columnLabelFormats[item.key], true);
      const formattedValue = formatLabel(item.value as number, columnLabelFormats[item.key]);

      return {
        seriesType: 'bar',
        color,
        usePercentage,
        formattedLabel,
        values: [
          {
            formattedValue,
            formattedLabel,
            formattedPercentage: getPercentage(
              item.value as number,
              dataPointDataIndex,
              dataPoint.datasetIndex,
              columnLabelFormats,
              chart,
              hasMultipleShownDatasets,
              percentageMode
            ),
          },
        ],
      };
    });
  });

  return tooltipItems;
};
