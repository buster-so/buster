import React from 'react';
import { BusterChartLegendItem } from '../../../BusterChartLegend';
import type { ChartJSOrUndefined } from '../../core/types';
import { type BusterChartProps, ChartType } from '@/api/asset_interfaces/metric/charts';
import type { ChartDataset } from 'chart.js';
import { formatLabelForPieLegend } from '../../../commonHelpers';
import { formatLabel } from '@/lib/columnFormatter';

export const getLegendItems = ({
  chartRef,
  colors,
  inactiveDatasets,
  selectedChartType,
  columnLabelFormats,
  columnSettings
}: {
  colors: string[];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  inactiveDatasets: Record<string, boolean>;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: ChartType;
}): BusterChartLegendItem[] => {
  const isComboChart = selectedChartType === 'combo';
  const globalType: ChartType = (chartRef.current?.config.type as ChartType) || ChartType.Bar;
  const isPieChart = globalType === ChartType.Pie;
  const data = chartRef.current?.data;

  if (!data) return [];

  if (isPieChart) {
    const labels: string[] = data.labels as string[];
    const hasMultipleYAxis = data.datasets.length > 1;

    return data.datasets.flatMap((dataset) => {
      return labels?.map<BusterChartLegendItem>((label, index) => ({
        color: colors[index % colors.length],
        inactive: inactiveDatasets[label],
        type: globalType,
        serieName: dataset.label,
        formattedName: formatLabelForPieLegend(label, dataset.label || '', hasMultipleYAxis),
        id: label,
        data: dataset.data,
        yAxisKey: dataset.yAxisKey
      }));
    });
  }

  const datasets =
    data.datasets?.filter((dataset) => !dataset.hidden && !dataset.isTrendline) || [];

  return datasets.map<BusterChartLegendItem>((dataset, index) => ({
    color: colors[index % colors.length],
    inactive: dataset.label ? inactiveDatasets[dataset.label] : false,
    type: getType(isComboChart, globalType, dataset, columnSettings),
    formattedName: dataset.label as string,
    id: dataset.label!,
    data: dataset.data,
    yAxisKey: dataset.yAxisKey
  }));
};

const getType = (
  isComboChart: boolean,
  globalType: ChartType,
  dataset: ChartDataset,
  columnSettings: NonNullable<BusterChartProps['columnSettings']>
): ChartType => {
  if (!isComboChart) return globalType;
  const key = dataset.yAxisKey;
  const columnLabelFormat = columnSettings[key];
  const columnVisualization = columnLabelFormat?.columnVisualization;
  if (columnVisualization === 'dot') return ChartType.Scatter;
  if (columnVisualization === 'line') return ChartType.Line;

  return ChartType.Bar;
};
