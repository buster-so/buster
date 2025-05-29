import type { ChartTypeRegistry, TooltipItem } from 'chart.js';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';

export const scatterTooltipHelper = (
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>
): ITooltipItem[] => {
  return dataPoints.slice(0, 1).flatMap<ITooltipItem>((dataPoint) => {
    const dataPointDataset = dataPoint.dataset;
    const dataPointDataIndex = dataPoint.dataIndex;
    const tooltipData = dataPointDataset.tooltipData;
    const selectedToolTipData = tooltipData[dataPointDataIndex];

    const title = dataPointDataset.label as string;

    return selectedToolTipData.map<ITooltipItem>((item) => {
      return {
        color: dataPointDataset.backgroundColor as string,
        seriesType: 'scatter',
        usePercentage: false,
        formattedLabel: title,
        values: [
          {
            formattedValue: formatLabel(item.value as number, columnLabelFormats[item.key]),
            formattedPercentage: undefined,
            formattedLabel: formatLabel(item.key as string, columnLabelFormats[item.key], true)
          }
        ]
      };
    });
  });
};
