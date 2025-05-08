'use client';

import React, { MutableRefObject, useMemo, useState } from 'react';
import {
  Chart,
  ChartHoverBarPlugin,
  ChartHoverLinePlugin,
  ChartHoverScatterPlugin,
  ChartTotalizerPlugin,
  OutLabelsPlugin
} from './core';
import type { ChartJSOrUndefined, ChartProps } from './core/types';
import type { ChartType as ChartJSChartType, ChartOptions, Plugin, UpdateMode } from 'chart.js';
import { useColors } from '../chartHooks';
import { useGoalLines, useOptions, useSeriesOptions } from './hooks';
import { useChartSpecificOptions } from './hooks/useChartSpecificOptions';
import type { BusterChartTypeComponentProps } from '../interfaces/chartComponentInterfaces';
import { useTrendlines } from './hooks/useTrendlines';
import type { ScatterAxis } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn, useMount, usePreviousRef } from '@/hooks';

export const BusterChartJSComponent = React.memo(
  React.forwardRef<ChartJSOrUndefined, BusterChartTypeComponentProps>(
    (
      {
        onChartReady,
        onInitialAnimationEnd,
        columnLabelFormats,
        columnSettings = {},
        selectedChartType,
        selectedAxis,
        className = '',
        colors: colorsProp,
        pieDonutWidth,
        pieInnerLabelTitle,
        pieInnerLabelAggregate,
        pieShowInnerLabel,
        pieLabelPosition,
        pieDisplayLabelAs,
        tooltipKeys,
        hasMismatchedTooltipsAndMeasures,
        y2AxisShowAxisTitle,
        y2AxisAxisTitle,
        yAxisAxisTitle,
        yAxisScaleType,
        yAxisShowAxisLabel,
        yAxisStartAxisAtZero,
        xAxisAxisTitle,
        xAxisShowAxisLabel,
        xAxisLabelRotation,
        yAxisKeys,
        y2AxisKeys,
        datasetOptions,
        dataTrendlineOptions,
        yAxisShowAxisTitle,
        xAxisShowAxisTitle,
        columnMetadata = [],
        y2AxisShowAxisLabel,
        y2AxisScaleType,
        y2AxisStartAxisAtZero,
        animate = true,
        barGroupType,
        barLayout,
        barShowTotalAtTop,
        scatterDotSize,
        gridLines,
        goalLines,
        lineGroupType,
        disableTooltip,
        xAxisTimeInterval,
        numberOfDataPoints,
        //TODO
        xAxisDataZoom,
        ...rest
      },
      ref
    ) => {
      const colors = useColors({
        colors: colorsProp,
        yAxisKeys,
        y2AxisKeys,
        datasetOptions: datasetOptions.datasets,
        selectedChartType
      });

      const { trendlineAnnotations, trendlineSeries } = useTrendlines({
        trendlines: dataTrendlineOptions,
        columnLabelFormats,
        selectedChartType,
        lineGroupType,
        barGroupType
      });

      const data: ChartProps<ChartJSChartType>['data'] = useSeriesOptions({
        selectedChartType,
        y2AxisKeys,
        yAxisKeys,
        columnSettings,
        columnLabelFormats,
        colors,
        barShowTotalAtTop,
        datasetOptions,
        xAxisKeys: selectedAxis.x,
        tooltipKeys,
        sizeKey: (selectedAxis as ScatterAxis).size,
        columnMetadata,
        scatterDotSize,
        lineGroupType,
        categoryKeys: (selectedAxis as ScatterAxis).category,
        trendlineSeries,
        barGroupType
      });
      const previousData = usePreviousRef(data);

      const { chartPlugins, chartOptions } = useChartSpecificOptions({
        selectedChartType,
        pieShowInnerLabel,
        pieInnerLabelTitle,
        pieInnerLabelAggregate,
        pieDonutWidth,
        selectedAxis,
        columnLabelFormats,
        pieLabelPosition,
        pieDisplayLabelAs,
        barShowTotalAtTop,
        columnSettings,
        barGroupType,
        data
      });

      const goalLinesAnnotations = useGoalLines({
        goalLines,
        selectedChartType,
        columnLabelFormats,
        yAxisKeys,
        y2AxisKeys,
        lineGroupType,
        barLayout,
        barGroupType
      });

      const options: ChartOptions<ChartJSChartType> = useOptions({
        goalLinesAnnotations,
        trendlineAnnotations,
        colors,
        selectedChartType,
        columnLabelFormats,
        selectedAxis,
        columnMetadata,
        barLayout,
        barGroupType,
        lineGroupType,
        xAxisLabelRotation,
        xAxisShowAxisLabel,
        gridLines,
        xAxisAxisTitle,
        xAxisShowAxisTitle,
        onChartReady,
        onInitialAnimationEnd,
        chartPlugins,
        chartOptions,
        tooltipKeys,
        columnSettings,
        pieDisplayLabelAs,
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
        disableTooltip,
        xAxisTimeInterval,
        numberOfDataPoints
      });

      const type = useMemo(() => {
        if (selectedChartType === 'pie') return 'pie';
        if (selectedChartType === 'bar') return 'bar';
        if (selectedChartType === 'scatter') return 'bubble';
        return 'line';
      }, [selectedChartType]);

      const chartSpecificPlugins = useMemo((): Plugin[] => {
        if (selectedChartType === 'scatter') return [ChartHoverScatterPlugin];
        if (selectedChartType === 'line') return [ChartHoverLinePlugin, ChartTotalizerPlugin];
        if (selectedChartType === 'bar') {
          return [ChartHoverBarPlugin, ChartTotalizerPlugin];
        }
        if (selectedChartType === 'pie') return [OutLabelsPlugin, ChartTotalizerPlugin];
        if (selectedChartType === 'combo') return [ChartHoverBarPlugin, ChartTotalizerPlugin];
        return [];
      }, [selectedChartType]);

      const updateMode = useMemoizedFn((params: { datasetIndex: number }): UpdateMode => {
        if (!ref) return 'default';
        const areLabelsChanged = previousData?.labels !== data.labels;
        if (areLabelsChanged) return 'none'; //this will disable animation
        return 'default';
      });

      console.log('trendlineSeries', {
        data,
        options
      });

      return (
        <ChartMountedWrapper>
          <Chart
            className={className}
            ref={ref}
            options={options}
            data={data}
            type={type}
            plugins={chartSpecificPlugins}
            updateMode={updateMode}
          />
        </ChartMountedWrapper>
      );
    }
  )
);

BusterChartJSComponent.displayName = 'BusterChartJSComponent';

const ChartMountedWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useMount(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 35);
  });

  if (!isMounted) {
    return (
      <div className="to-bg-gradient-to-r to-border/15 h-full w-full bg-gradient-to-b from-transparent" />
    );
  }

  return children;
};
