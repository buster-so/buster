import React, { useMemo } from 'react';
import {
  BusterChartProps,
  ChartEncodes,
  ChartType,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '../../../interfaces';
import { DEFAULT_CHART_CONFIG } from '@/api/buster_rest';
import { useYAxisTickOptions } from './useYAxisTickOptions';
import { useXAxisTickOptions } from './useXAxisTickOptions';

export const useAxisAndTickOptions = ({
  selectedAxis,
  columnLabelFormats,
  selectedChartType,
  yAxisShowAxisLabel = DEFAULT_CHART_CONFIG.yAxisShowAxisLabel,
  yAxisStartAxisAtZero = DEFAULT_CHART_CONFIG.yAxisStartAxisAtZero,
  yAxisScaleType = DEFAULT_CHART_CONFIG.yAxisScaleType,
  xAxisLabelRotation = DEFAULT_CHART_CONFIG.xAxisLabelRotation,
  xAxisShowAxisLabel = DEFAULT_CHART_CONFIG.xAxisShowAxisLabel,
  xAxisDataZoom = DEFAULT_CHART_CONFIG.xAxisDataZoom,
  barLayout = DEFAULT_CHART_CONFIG.barLayout,
  columnMetadata,
  barGroupType,
  lineGroupType,
  gridLines = DEFAULT_CHART_CONFIG.gridLines,
  columnSettings,
  barShowTotalAtTop,
  y2AxisScaleType = DEFAULT_CHART_CONFIG.y2AxisScaleType,
  y2AxisStartAxisAtZero = DEFAULT_CHART_CONFIG.y2AxisStartAxisAtZero,
  y2AxisShowAxisLabel = DEFAULT_CHART_CONFIG.y2AxisShowAxisLabel
}: {
  selectedAxis: ChartEncodes;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: BusterChartProps['selectedChartType'];
  barLayout: BusterChartProps['barLayout'];
  barGroupType: BusterChartProps['barGroupType'];
  lineGroupType: BusterChartProps['lineGroupType'];
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']> | undefined;
  gridLines: BusterChartProps['gridLines'];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
} & Omit<YAxisConfig, 'yAxisShowAxisTitle' | 'yAxisAxisTitle'> &
  Omit<Y2AxisConfig, 'y2AxisShowAxisTitle' | 'y2AxisAxisTitle'> &
  Omit<XAxisConfig, 'xAxisShowAxisTitle' | 'xAxisAxisTitle'>) => {
  const isPieChart = selectedChartType === ChartType.Pie;
  const useHorizontalBar = selectedChartType === ChartType.Bar && barLayout === 'horizontal';

  const usePercentageModeAxis = useMemo(() => {
    if (selectedChartType === 'bar') return barGroupType === 'percentage-stack';
    if (selectedChartType === 'line') return lineGroupType === 'percentage-stack';
    return false;
  }, [lineGroupType, selectedChartType, barGroupType]);

  const { yAxis, y2Axis } = useYAxisTickOptions({
    selectedAxis,
    columnLabelFormats,
    selectedChartType,
    columnSettings,
    yAxisScaleType,
    yAxisStartAxisAtZero,
    yAxisShowAxisLabel,
    gridLines,
    barShowTotalAtTop,
    useHorizontalBar,
    usePercentageModeAxis,
    y2AxisScaleType,
    y2AxisStartAxisAtZero,
    y2AxisShowAxisLabel
  });

  const { xAxis } = useXAxisTickOptions({
    selectedAxis,
    columnLabelFormats,
    columnMetadata,
    selectedChartType,
    useHorizontalBar,
    usePercentageModeAxis,
    xAxisShowAxisLabel,
    xAxisLabelRotation,
    gridLines
  });

  //GRID CONFIG

  const axisAndTickOptions = useMemo(() => {
    if (isPieChart) return {};

    const allYAxis = [...yAxis, ...y2Axis];

    return {
      //we fall back on the default options from the theme :)
      xAxis: useHorizontalBar ? allYAxis : xAxis,
      yAxis: useHorizontalBar ? xAxis : allYAxis
    };
  }, [xAxis, isPieChart, yAxis, y2Axis, useHorizontalBar]);

  return axisAndTickOptions;
};
