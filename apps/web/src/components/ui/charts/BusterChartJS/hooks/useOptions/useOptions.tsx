import type { BarAndLineAxis, ChartConfigProps, ChartEncodes } from '@buster/server-shared/metrics';
import type { ChartType as ChartJSChartType, PluginChartOptions } from 'chart.js';
import type { AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOptionsWithTicks } from '../../../chartHooks';
import {
  LINE_DECIMATION_SAMPLES,
  LINE_DECIMATION_THRESHOLD,
  TOOLTIP_THRESHOLD,
} from '../../../config';
import type { BusterChartTypeComponentProps } from '../../../interfaces';
import type { ChartProps } from '../../core';
import { createAggregrateTrendlines } from '../useSeriesOptions/createTrendlines';
import { useAnimations } from './useAnimations';
import { useInteractions } from './useInteractions';
import { useTooltipOptions } from './useTooltipOptions.ts/useTooltipOptions';
import { useXAxis } from './useXAxis';
import { useY2Axis } from './useY2Axis';
import { useYAxis } from './useYAxis';

interface UseOptionsProps {
  colors: string[];
  selectedChartType: ChartConfigProps['selectedChartType'];
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
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
  datasetOptions: DatasetOptionsWithTicks;
  hasMismatchedTooltipsAndMeasures: boolean;
  yAxisShowAxisLabel: NonNullable<BusterChartProps['yAxisShowAxisLabel']>;
  yAxisStartAxisAtZero: BusterChartProps['yAxisStartAxisAtZero'];
  y2AxisShowAxisLabel: BusterChartProps['y2AxisShowAxisLabel'];
  y2AxisScaleType: BusterChartProps['y2AxisScaleType'];
  y2AxisStartAxisAtZero: BusterChartProps['y2AxisStartAxisAtZero'];
  yAxisScaleType: BusterChartProps['yAxisScaleType'];
  animate: boolean;
  goalLinesAnnotations: AnnotationPluginOptions['annotations'];
  disableTooltip: boolean;
  xAxisTimeInterval: BusterChartProps['xAxisTimeInterval'];
  numberOfDataPoints: number;
  trendlines: BusterChartProps['trendlines'];
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
  trendlines,
  goalLinesAnnotations,
  disableTooltip: disableTooltipProp,
  xAxisTimeInterval,
  numberOfDataPoints,
}: UseOptionsProps): ChartProps<ChartJSChartType>['options'] => {
  const xAxis = useXAxis({
    columnLabelFormats,
    columnSettings,
    selectedAxis,
    selectedChartType,
    xAxisLabelRotation,
    xAxisShowAxisLabel,
    gridLines,
    xAxisAxisTitle,
    xAxisShowAxisTitle,
    lineGroupType,
    barGroupType,
    xAxisTimeInterval,
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
    gridLines,
    columnSettings,
  });

  const y2Axis = useY2Axis({
    columnLabelFormats,
    selectedAxis,
    selectedChartType,
    y2AxisAxisTitle,
    y2AxisShowAxisTitle,
    y2AxisShowAxisLabel,
    y2AxisScaleType,
    y2AxisStartAxisAtZero,
    columnMetadata,
    yAxis,
  });

  const isHorizontalBar = useMemo(() => {
    return selectedChartType === 'bar' && barLayout === 'horizontal';
  }, [selectedChartType, barLayout]);

  const scales = useMemo(() => {
    if (xAxis === undefined && yAxis === undefined) return undefined;

    return {
      x: isHorizontalBar ? yAxis : xAxis,
      y: isHorizontalBar ? xAxis : yAxis,
      y2: y2Axis,
    };
  }, [xAxis, yAxis, y2Axis, isHorizontalBar]);

  const chartMounted = useMemo(() => {
    return {
      onMounted: onChartReady,
      onInitialAnimationEnd,
    };
  }, [onChartReady, onInitialAnimationEnd]);

  const interaction = useInteractions({ selectedChartType, barLayout });

  const animation = useAnimations({
    animate,
    numberOfDataPoints,
    selectedChartType,
    barGroupType,
  });

  const disableTooltip = useMemo(() => {
    return disableTooltipProp || numberOfDataPoints > TOOLTIP_THRESHOLD;
  }, [disableTooltipProp, numberOfDataPoints]);

  const tooltipOptions = useTooltipOptions({
    columnLabelFormats,
    selectedChartType,
    tooltipKeys,
    barGroupType,
    lineGroupType,
    pieDisplayLabelAs,
    selectedAxis,
    columnSettings,
    hasMismatchedTooltipsAndMeasures,
    disableTooltip,
    colors,
  });

  const trendlineOptions = useMemo(() => {
    return createAggregrateTrendlines({
      trendlines,
      columnLabelFormats,
      selectedAxis,
    });
  }, [trendlines, columnLabelFormats, selectedAxis.y, (selectedAxis as { y2: string[] }).y2]);

  const options: ChartProps<ChartJSChartType>['options'] = useMemo(() => {
    const chartAnnotations = chartPlugins?.annotation?.annotations;
    const isLargeDataset = numberOfDataPoints > LINE_DECIMATION_THRESHOLD;
    const hasColorBy = (selectedAxis as BarAndLineAxis).colorBy?.length > 0;

    return {
      skipNull: hasColorBy,
      indexAxis: isHorizontalBar ? 'y' : 'x',
      backgroundColor: colors,
      borderColor: colors,
      scales,
      interaction,
      plugins: {
        chartMounted,
        tooltip: tooltipOptions,
        ...chartPlugins,
        annotation: {
          annotations: { ...goalLinesAnnotations, ...chartAnnotations },
        },
        decimation: {
          enabled: isLargeDataset,
          algorithm: 'lttb',
          samples: LINE_DECIMATION_SAMPLES,
        },
        trendline: trendlineOptions,
      },
      animation,
      ...chartOptions,
    } as ChartProps<ChartJSChartType>['options'];
  }, [
    animation,
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
    tooltipOptions,
    trendlineOptions,
  ]);

  return options;
};
