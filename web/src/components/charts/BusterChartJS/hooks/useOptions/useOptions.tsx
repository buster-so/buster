import { useMemo } from 'react';
import type { ChartProps } from '../../core';
import type { ChartType as ChartJSChartType, Scale } from 'chart.js';
import type {
  BusterChartConfigProps,
  BusterChartProps,
  ChartEncodes
} from '@/components/charts/interfaces';
import { useInteractions } from './useInteractions';
import { useXAxis } from './useXAxis';
import { useYAxis } from './useYAxis';
import { DeepPartial } from 'utility-types';
import type { PluginChartOptions } from 'chart.js';
import { useTooltipOptions } from './useTooltipOptions.ts/useTooltipOptions';
import { DatasetOption } from '@/components/charts/chartHooks';
import { useY2Axis } from './useY2Axis';
import { AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import { BusterChartTypeComponentProps } from '@/components/charts/interfaces/chartComponentInterfaces';

interface UseOptionsProps {
  colors: string[];
  selectedChartType: BusterChartConfigProps['selectedChartType'];
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  barLayout: BusterChartProps['barLayout'];
  barGroupType: BusterChartProps['barGroupType'];
  lineGroupType: BusterChartProps['lineGroupType'];
  xAxisLabelRotation: NonNullable<BusterChartProps['xAxisLabelRotation']>;
  xAxisShowAxisLabel: NonNullable<BusterChartProps['xAxisShowAxisLabel']>;
  gridLines: NonNullable<BusterChartProps['gridLines']>;
  xAxisAxisTitle: BusterChartProps['xAxisAxisTitle'];
  xAxisShowAxisTitle: BusterChartProps['xAxisShowAxisTitle'];
  yAxisAxisTitle: BusterChartProps['yAxisAxisTitle'];
  yAxisShowAxisTitle: BusterChartProps['yAxisShowAxisTitle'];
  y2AxisAxisTitle: BusterChartProps['y2AxisAxisTitle'];
  y2AxisShowAxisTitle: BusterChartProps['y2AxisShowAxisTitle'];
  onChartReady: BusterChartTypeComponentProps['onChartReady'];
  onInitialAnimationEnd: BusterChartTypeComponentProps['onInitialAnimationEnd'];
  chartPlugins: DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'];
  chartOptions: ChartProps<ChartJSChartType>['options'];
  pieDisplayLabelAs: NonNullable<BusterChartProps['pieDisplayLabelAs']>;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  tooltipKeys: string[];
  datasetOptions: DatasetOption[];
  hasMismatchedTooltipsAndMeasures: boolean;
  yAxisShowAxisLabel: NonNullable<BusterChartProps['yAxisShowAxisLabel']>;
  yAxisStartAxisAtZero: BusterChartProps['yAxisStartAxisAtZero'];
  y2AxisShowAxisLabel: BusterChartProps['y2AxisShowAxisLabel'];
  y2AxisScaleType: BusterChartProps['y2AxisScaleType'];
  y2AxisStartAxisAtZero: BusterChartProps['y2AxisStartAxisAtZero'];
  yAxisScaleType: BusterChartProps['yAxisScaleType'];
  animate: boolean;
  goalLinesAnnotations: AnnotationPluginOptions['annotations'];
  trendlineAnnotations: AnnotationPluginOptions['annotations'];
  disableTooltip: boolean;
}

export const useOptions = ({
  columnLabelFormats,
  colors,
  selectedAxis,
  selectedChartType,
  columnMetadata,
  barLayout,
  barGroupType,
  lineGroupType,
  xAxisLabelRotation,
  xAxisShowAxisLabel,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  gridLines,
  onChartReady,
  onInitialAnimationEnd,
  chartPlugins,
  chartOptions,
  pieDisplayLabelAs,
  columnSettings,
  tooltipKeys,
  datasetOptions,
  hasMismatchedTooltipsAndMeasures,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  y2AxisAxisTitle,
  y2AxisShowAxisTitle,
  yAxisShowAxisLabel,
  yAxisStartAxisAtZero,
  y2AxisShowAxisLabel,
  y2AxisScaleType,
  y2AxisStartAxisAtZero,
  yAxisScaleType,
  animate,
  goalLinesAnnotations,
  trendlineAnnotations,
  disableTooltip
}: UseOptionsProps) => {
  const xAxis = useXAxis({
    columnLabelFormats,
    columnSettings,
    selectedAxis,
    selectedChartType,
    columnMetadata,
    xAxisLabelRotation,
    xAxisShowAxisLabel,
    gridLines,
    xAxisAxisTitle,
    xAxisShowAxisTitle,
    lineGroupType,
    barGroupType
  });

  const yAxis = useYAxis({
    columnLabelFormats,
    selectedAxis,
    selectedChartType,
    columnMetadata,
    barGroupType,
    lineGroupType,
    yAxisAxisTitle,
    yAxisShowAxisTitle,
    yAxisStartAxisAtZero,
    yAxisShowAxisLabel,
    yAxisScaleType,
    gridLines
  });

  const y2Axis = useY2Axis({
    columnLabelFormats,
    selectedAxis,
    selectedChartType,
    y2AxisAxisTitle,
    y2AxisShowAxisTitle,
    y2AxisShowAxisLabel,
    y2AxisScaleType,
    y2AxisStartAxisAtZero
  });

  const isHorizontalBar = useMemo(() => {
    return selectedChartType === 'bar' && barLayout === 'horizontal';
  }, [selectedChartType, barLayout]);

  const scales = useMemo(() => {
    if (xAxis === undefined && yAxis === undefined) return undefined;

    return {
      x: isHorizontalBar ? yAxis : xAxis,
      y: isHorizontalBar ? xAxis : yAxis,
      y2: y2Axis
    };
  }, [xAxis, yAxis, y2Axis, isHorizontalBar]);

  const chartMounted = useMemo(() => {
    return {
      onMounted: onChartReady,
      onInitialAnimationEnd: onInitialAnimationEnd
    };
  }, [onChartReady, onInitialAnimationEnd]);

  const interaction = useInteractions({ selectedChartType, barLayout });

  const tooltipOptions = useTooltipOptions({
    columnLabelFormats,
    selectedChartType,
    tooltipKeys,
    barGroupType,
    lineGroupType,
    pieDisplayLabelAs,
    selectedAxis,
    columnSettings,
    datasetOptions,
    hasMismatchedTooltipsAndMeasures,
    disableTooltip
  });

  const options: ChartProps<ChartJSChartType>['options'] = useMemo(() => {
    const chartAnnotations = chartPlugins?.annotation?.annotations;

    return {
      indexAxis: isHorizontalBar ? 'y' : 'x',
      animation: animate ? { duration: 1000 } : false,
      responsive: true,
      maintainAspectRatio: false,
      backgroundColor: colors,
      borderColor: colors,
      scales,
      interaction,
      plugins: {
        chartMounted,
        tooltip: tooltipOptions,
        ...chartPlugins,
        annotation: {
          annotations: { ...goalLinesAnnotations, ...chartAnnotations, ...trendlineAnnotations }
        },
        decimation: {
          enabled: datasetOptions[0].source.length > 500,
          algorithm: 'min-max'
        }
      },
      ...chartOptions
    };
  }, [
    animate,
    colors,
    scales,
    interaction,
    chartPlugins,
    chartOptions,
    chartMounted,
    onChartReady,
    onInitialAnimationEnd,
    isHorizontalBar,
    goalLinesAnnotations,
    trendlineAnnotations
  ]);

  return options;
};
