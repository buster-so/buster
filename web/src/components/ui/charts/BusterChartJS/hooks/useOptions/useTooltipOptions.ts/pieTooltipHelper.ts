import type {
  BusterChartConfigProps,
  BusterChartProps
} from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib';
import type { Chart, ChartTypeRegistry, TooltipItem } from 'chart.js';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';
import { percentageFormatter } from './helpers';

export const pieTooltipHelper = (
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  chart: Chart,
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>,
  keyToUsePercentage: string[]
): ITooltipItem[] => {
  const tooltipItems = dataPoints.flatMap<ITooltipItem>((dataPoint) => {
    const tooltipDataset = dataPoint.dataset;
    const datasetIndex = dataPoint.datasetIndex;
    const dataPointDataIndex = dataPoint.dataIndex;
    const tooltipData = tooltipDataset.tooltipData;
    const selectedToolTipData = tooltipData[dataPointDataIndex];

    const items = selectedToolTipData.map<ITooltipItem>((item) => {
      const { key, value } = item;
      const usePercentage = keyToUsePercentage.includes(key);
      const color = (tooltipDataset.backgroundColor as string[])[dataPointDataIndex];
      const formattedLabel = formatLabel(key as string, columnLabelFormats[key as string], true);
      const formattedValue = formatLabel(value as number, columnLabelFormats[key as string]);
      const formattedPercentage = usePercentage
        ? getPiePercentage(
            dataPointDataIndex,
            datasetIndex,
            tooltipDataset.data,
            columnLabelFormats,
            chart
          )
        : undefined;

      return {
        seriesType: 'pie',
        color,
        usePercentage,
        formattedLabel,
        values: [{ formattedValue, formattedLabel, formattedPercentage }]
      };
    });

    return items;
  });

  return tooltipItems;
};

const getPiePercentage = (
  dataPointDataIndex: number,
  datasetIndex: number,
  datasetData: Chart['data']['datasets'][number]['data'],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  chart: Chart
): string => {
  const totalizer = chart.$totalizer;
  const total = totalizer.seriesTotals[datasetIndex];
  const compareValue = datasetData[dataPointDataIndex] as number;
  const percentage = (compareValue / total) * 100;
  const dataset = chart.data.datasets[datasetIndex];
  const yAxisKey = dataset.yAxisKey;

  return percentageFormatter(percentage, yAxisKey, columnLabelFormats);
};
