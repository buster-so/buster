import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';
import type { Chart, ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
import { formatChartLabel } from '../../../helpers';
import { getPercentage } from './helper';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import { formatChartValueDelimiter } from '@/components/ui/charts/commonHelpers';

export const barAndLineTooltipHelper = (
  datasets: ChartDataset[],
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  chart: Chart,
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>,
  hasMultipleMeasures: boolean,
  keyToUsePercentage: string[],
  hasCategoryAxis: boolean,
  hasMultipleShownDatasets: boolean,
  percentageMode: undefined | 'stacked'
): ITooltipItem[] => {
  const dataPoint = dataPoints[0];
  const dataPointDataset = dataPoint.dataset;

  const tooltipItems = dataPoints.flatMap<ITooltipItem>((dataPoint) => {
    const tooltipDataset = dataPoint.dataset;
    const dataPointDataIndex = dataPoint.dataIndex;
    const tooltipData = tooltipDataset.tooltipData;
    const selectedToolTipData = tooltipData[dataPointDataIndex];
    const items = selectedToolTipData.map<ITooltipItem>((item) => {
      const colorItem = tooltipDataset?.backgroundColor as string;
      const color = tooltipDataset
        ? typeof colorItem === 'function'
          ? (tooltipDataset?.borderColor as string)
          : (tooltipDataset?.backgroundColor as string)
        : undefined;
      const usePercentage =
        !!percentageMode || keyToUsePercentage.includes(tooltipDataset.label as string);

      return {
        seriesType: 'bar',
        color,
        usePercentage,
        formattedLabel: formatChartLabel(
          tooltipDataset.label as string,
          columnLabelFormats,
          hasMultipleMeasures,
          hasCategoryAxis
        ),
        values: [
          {
            formattedValue: formatChartValueDelimiter(
              item.value as number,
              item.key,
              columnLabelFormats
            ),
            formattedLabel: item.key,
            formattedPercentage: getPercentage(
              item.value as number,
              dataPointDataIndex,
              dataPoint.datasetIndex,
              tooltipDataset.label as string,
              columnLabelFormats,
              chart,
              hasMultipleShownDatasets,
              percentageMode
            )
          }
        ]
      };
    });

    return items;
  });

  return tooltipItems;
};
