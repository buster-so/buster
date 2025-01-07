import { ITooltipItem } from '@/components/charts/BusterChartTooltip/interfaces';
import { BusterChartConfigProps } from '@/components/charts/interfaces';
import type { ChartDataset, TooltipItem, ChartTypeRegistry } from 'chart.js';
import { appendToKeyValueChain, extractFieldsFromChain } from '@/components/charts/chartHooks';
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

  const tooltipDatasets = datasets.filter((dataset) => dataset.hidden && !dataset.isTrendline);
  const dataPointDataIndex = dataPoint.dataIndex;

  let relevantDatasets: ChartDataset[] = [];

  if (hasCategoryAxis) {
    const dataPointCategory = extractFieldsFromChain(dataPointDataset.label!).at(0)?.value!;
    relevantDatasets = tooltipDatasets.filter((dataset) => {
      const datasetCategory = extractFieldsFromChain(dataset.label!).at(0)?.value!;
      return datasetCategory === dataPointCategory;
    });
  } else {
    relevantDatasets = tooltipDatasets;
  }

  const values = relevantDatasets.map((dataset) => {
    const label = appendToKeyValueChain(extractFieldsFromChain(dataset.label!).at(-1)!);
    const rawValue = dataset.data[dataPointDataIndex] as number;
    const key = extractFieldsFromChain(label).at(-1)?.key!;
    const formattedValue = formatLabel(rawValue, columnLabelFormats[key]);
    const formattedLabel = formatChartLabel(
      label,
      columnLabelFormats,
      hasMultipleMeasures,
      hasCategoryAxis
    );

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
