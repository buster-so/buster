import type { ChartType } from '@buster/server-shared/metrics';
import type { ChartDataset } from 'chart.js';
import type React from 'react';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { BusterChartLegendItem } from '../../../BusterChartLegend';
import { formatLabelForPieLegend } from '../../../commonHelpers';
import type { ChartJSOrUndefined } from '../../core/types';

export const getLegendItems = ({
  chartRef,
  colors,
  inactiveDatasets,
  selectedChartType,
  columnSettings,
}: {
  colors: string[];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  inactiveDatasets: Record<string, boolean>;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: ChartType;
}): BusterChartLegendItem[] => {
  const isComboChart = selectedChartType === 'combo';
  const globalType: ChartType = (chartRef.current?.config.type as ChartType) || 'bar';
  const isPieChart = globalType === 'pie';
  const data = chartRef.current?.data;

  if (!data) return [];

  if (isPieChart) {
    const labels: string[] = data.labels as string[];
    const hasMultipleYAxis = data.datasets.length > 1;

    return data.datasets.flatMap((dataset) => {
      return labels?.map<BusterChartLegendItem>((label, index) => ({
        color: colors[index % colors.length] ?? '',
        inactive: inactiveDatasets[label] ?? false,
        type: globalType,
        serieName: dataset.label ?? '',
        formattedName: formatLabelForPieLegend(label, dataset.label || '', hasMultipleYAxis),
        id: label,
        data: dataset.data,
        yAxisKey: dataset.yAxisKey,
      }));
    });
  }

  const datasets = data.datasets?.filter((dataset) => !dataset.hidden) || [];

  return datasets.map<BusterChartLegendItem>((dataset, index) => {
    return {
      color: getColor(dataset, colors, index),
      inactive: dataset.label ? (inactiveDatasets[dataset.label] ?? false) : false,
      type: getType(isComboChart, globalType, dataset, columnSettings),
      formattedName: dataset.label as string,
      id: dataset.label || '',
      data: dataset.data,
      yAxisKey: dataset.yAxisKey,
    };
  });
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
  if (columnVisualization === 'dot') return 'scatter';
  if (columnVisualization === 'line') return 'line';

  return 'bar';
};

const getColor = (dataset: ChartDataset, colors: string[], index: number) => {
  if (dataset.backgroundColor) {
    if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor.length > 0) {
      return dataset.backgroundColor;
    } else if (typeof dataset.backgroundColor === 'string') {
      return dataset.backgroundColor;
    }
  }

  return colors[index % colors.length];
};
