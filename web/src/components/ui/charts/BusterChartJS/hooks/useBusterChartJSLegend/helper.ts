import React from 'react';
import { BusterChartLegendItem } from '@/components/ui/charts/BusterChartLegend';
import { ChartJSOrUndefined } from '../../core/types';
import { BusterChartProps, ChartType } from '@/components/ui/charts/interfaces';
import { formatChartLabel } from '../../helpers';
import type { ChartDataset } from 'chart.js';
import { extractFieldsFromChain } from '@/components/ui/charts/chartHooks';

export const getLegendItems = ({
  chartRef,
  colors,
  inactiveDatasets,
  selectedChartType,
  allYAxisColumnNames,
  columnLabelFormats,
  categoryAxisColumnNames,
  columnSettings
}: {
  colors: string[];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  inactiveDatasets: Record<string, boolean>;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: ChartType;
  allYAxisColumnNames: string[];
  categoryAxisColumnNames?: string[];
}): BusterChartLegendItem[] => {
  const isComboChart = selectedChartType === 'combo';
  //@ts-ignore
  const globalType: ChartType = (chartRef.current?.config.type as 'pie') || ChartType.Bar;
  const isPieChart = globalType === ChartType.Pie;
  const data = chartRef.current?.data!;

  if (isPieChart) {
    const labels: string[] = data.labels as string[];
    return labels?.map<BusterChartLegendItem>((label, index) => ({
      color: colors[index % colors.length],
      inactive: inactiveDatasets[label],
      type: globalType,
      formattedName: label,
      id: label
    }));
  }

  const datasets = data.datasets!.filter((dataset) => !dataset.hidden && !dataset.isTrendline);
  const hasMultipleMeasures = allYAxisColumnNames.length > 1;
  const hasCategoryAxis: boolean = !!categoryAxisColumnNames && categoryAxisColumnNames?.length > 0;

  return datasets.map<BusterChartLegendItem>((dataset, index) => ({
    color: colors[index % colors.length],
    inactive: inactiveDatasets[dataset.label!],
    type: getType(isComboChart, globalType, dataset, columnSettings),
    formattedName: formatChartLabel(
      dataset.label!,
      columnLabelFormats,
      hasMultipleMeasures,
      hasCategoryAxis
    ),
    id: dataset.label!
  }));
};

const getType = (
  isComboChart: boolean,
  globalType: ChartType,
  dataset: ChartDataset,
  columnSettings: NonNullable<BusterChartProps['columnSettings']>
): ChartType => {
  if (!isComboChart) return globalType;
  const key = extractFieldsFromChain(dataset.label!).at(-1)!?.key;
  const columnLabelFormat = columnSettings[key];
  const columnVisualization = columnLabelFormat?.columnVisualization;
  if (columnVisualization === 'dot') return ChartType.Scatter;
  if (columnVisualization === 'line') return ChartType.Line;

  return ChartType.Bar;
};
