import type { Chart, ChartType as ChartJSChartType, TooltipItem } from 'chart.js';
import type React from 'react';
import { useMemo } from 'react';
import { type BusterChartProps, ChartType } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import { BusterChartTooltip } from '../../../../BusterChartTooltip';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';
import { barAndLineTooltipHelper } from './barAndLineTooltipHelper';
import { pieTooltipHelper } from './pieTooltipHelper';
import { scatterTooltipHelper } from './scatterTooltipHelper';

export const BusterChartJSTooltip: React.FC<{
  chart: Chart;
  dataPoints: TooltipItem<ChartJSChartType>[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  hasCategoryAxis: boolean;
  hasMultipleMeasures: boolean;
  keyToUsePercentage: string[];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
}> = ({
  chart,
  dataPoints: dataPointsProp,
  columnLabelFormats,
  selectedChartType,
  hasCategoryAxis,
  keyToUsePercentage,
  hasMultipleMeasures,
  lineGroupType,
  barGroupType
}) => {
  const isPieChart = selectedChartType === 'pie';
  const isScatter = selectedChartType === 'scatter';
  const isLine = selectedChartType === 'line';
  const isBar = selectedChartType === 'bar';
  const isPie = selectedChartType === 'pie';
  const isComboChart = selectedChartType === 'combo';
  const datasets = chart.data.datasets;
  const dataPoints = dataPointsProp;

  const percentageMode: undefined | 'stacked' = useMemo(() => {
    if (isBar) {
      return barGroupType === 'percentage-stack' ? 'stacked' : undefined;
    }
    if (isLine) {
      return lineGroupType === 'percentage-stack' ? 'stacked' : undefined;
    }
    return undefined;
  }, [isBar, barGroupType, isLine, lineGroupType]);

  const tooltipItems: ITooltipItem[] = useMemo(() => {
    if (isBar || isLine || isComboChart) {
      const hasMultipleShownDatasets = datasets.filter((dataset) => !dataset.hidden).length > 1;

      return barAndLineTooltipHelper(
        dataPoints,
        chart,
        columnLabelFormats,
        keyToUsePercentage,
        hasMultipleShownDatasets,
        percentageMode
      );
    }

    if (isPieChart) {
      return pieTooltipHelper(dataPoints, chart, columnLabelFormats, keyToUsePercentage);
    }

    if (isScatter) {
      return scatterTooltipHelper(dataPoints, columnLabelFormats);
    }

    return [];
  }, []);

  const title = useMemo(() => {
    if (isScatter) {
      if (!hasCategoryAxis) return undefined;
      return {
        title: tooltipItems[0].formattedLabel,
        color: tooltipItems[0].color,
        seriesType: 'scatter'
      };
    }

    const dataIndex = dataPoints[0].dataIndex;
    const value = dataIndex !== undefined ? chart.data.labels?.[dataIndex] : undefined;
    if (typeof value === 'string') return String(value);

    const datasetIndex = dataPoints[0].datasetIndex;
    const dataset = datasetIndex !== undefined ? datasets[datasetIndex] : undefined;
    const xAxisKeys = dataset?.xAxisKeys;
    const key = xAxisKeys?.at(0);
    const columnLabelFormat = key ? columnLabelFormats[key] : undefined;

    if (columnLabelFormat) {
      return formatLabel(value as number | string, columnLabelFormat);
    }

    return undefined;
  }, [dataPoints, isPie, isScatter, chart, tooltipItems[0], hasCategoryAxis]);

  //use mount will not work here because the tooltip is passed to a renderString function
  const busterTooltipNode = document?.querySelector('#buster-chartjs-tooltip');
  if (busterTooltipNode) {
    if (tooltipItems.length === 0) {
      (busterTooltipNode as HTMLElement).style.display = 'none';
    } else {
      (busterTooltipNode as HTMLElement).style.display = 'block';
    }
  }

  return <BusterChartTooltip title={title} tooltipItems={tooltipItems} />;
};
