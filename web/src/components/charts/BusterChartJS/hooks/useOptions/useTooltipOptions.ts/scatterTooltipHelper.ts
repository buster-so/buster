import { ITooltipItem } from '@/components/charts/BusterChartTooltip/interfaces';
import { BusterChartConfigProps } from '@/components/charts/interfaces';
import type { ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
import { formatChartLabelDelimiter } from '../../../../commonHelpers';
import { extractFieldsFromChain } from '@/components/charts/chartHooks';
import { formatChartLabel } from '../../../helpers';
import { formatLabel } from '@/utils';

export const scatterTooltipHelper = (
  datasets: ChartDataset[],
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>,
  hasMultipleMeasures: boolean,
  hasCategoryAxis: boolean
): ITooltipItem[] => {
  const dataPoint = dataPoints[0];
  const dataPointDatasetIndex = dataPoint.datasetIndex;
  const dataPointDataset = datasets[dataPointDatasetIndex!];
  const rawLabel = dataPointDataset.label!;
  const color = datasets[dataPointDatasetIndex!].borderColor as string;
  const title = formatChartLabel(
    rawLabel,
    columnLabelFormats,
    hasMultipleMeasures,
    hasCategoryAxis
  );

  const tooltipDatasets = datasets.filter((dataset) => dataset.hidden);
  const dataPointDataIndex = dataPoint.dataIndex;

  const datapointIsInTooltip = tooltipDatasets.some(
    (dataset) => dataset.label === dataPointDataset.label
  );

  // if (!datapointIsInTooltip) {
  //   return [];   //I removed the early return because if tooltip only had non plotted values it would not show
  // }

  const values = tooltipDatasets.map((dataset) => {
    const label = dataset.label!;
    const rawValue = dataset.data[dataPointDataIndex] as number;
    const key = extractFieldsFromChain(label).at(-1)?.key!;
    const formattedValue = formatLabel(rawValue, columnLabelFormats[key]);
    const formattedLabel = formatChartLabelDelimiter(label, columnLabelFormats);

    return {
      formattedValue,
      formattedLabel,
      formattedPercentage: undefined
    };
  });

  return [
    {
      usePercentage: false,
      color,
      seriesType: 'scatter',
      formattedLabel: title,
      values
    }
  ];
};
