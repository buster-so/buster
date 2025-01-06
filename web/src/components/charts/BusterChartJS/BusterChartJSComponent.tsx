import React, { useMemo } from 'react';
import {
  Chart,
  ChartHoverBarPlugin,
  ChartHoverLinePlugin,
  ChartHoverScatterPlugin,
  ChartTotalizerPlugin,
  OutLabelsPlugin
} from './core';
import { ChartJSOrUndefined, ChartProps } from './core/types';
import type { ChartType as ChartJSChartType } from 'chart.js';
import { useColors } from '../chartHooks';
import { useGoalLines, useOptions, useSeriesOptions } from './hooks';
import { useChartSpecificOptions } from './hooks/useChartSpecificOptions';
import { BusterChartTypeComponentProps } from '../interfaces/chartComponentInterfaces';
import { useTrendlines } from './hooks/useTrendlines';
import { ScatterAxis } from '../interfaces';

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
        //TODO
        xAxisDataZoom,
        useRapidResizeObserver = false,
        ...rest
      },
      ref
    ) => {
      const colors = useColors({ colors: colorsProp, yAxisKeys, y2AxisKeys, datasetOptions });

      const { trendlineAnnotations, trendlineSeries } = useTrendlines({
        trendlines: dataTrendlineOptions,
        columnLabelFormats,
        selectedChartType
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
        trendlineSeries
      });

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
        y2AxisKeys
      });

      const options = useOptions({
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
        disableTooltip
      });

      const type = useMemo(() => {
        if (selectedChartType === 'pie') return 'pie';
        if (selectedChartType === 'bar') return 'bar';
        if (selectedChartType === 'scatter') return 'bubble';
        return 'line';
      }, [selectedChartType]);

      const chartSpecificPlugins = useMemo((): any[] => {
        if (selectedChartType === 'scatter') return [ChartHoverScatterPlugin];
        if (selectedChartType === 'line') return [ChartHoverLinePlugin, ChartTotalizerPlugin];
        if (selectedChartType === 'bar') {
          return [ChartHoverBarPlugin, ChartTotalizerPlugin];
        }
        if (selectedChartType === 'pie') return [OutLabelsPlugin, ChartTotalizerPlugin];
        if (selectedChartType === 'combo') return [ChartHoverBarPlugin, ChartTotalizerPlugin];
        return [];
      }, [selectedChartType]);

      return (
        <React.Fragment>
          <Chart
            className={className}
            ref={ref}
            options={options}
            data={data}
            type={type}
            plugins={chartSpecificPlugins}
          />
        </React.Fragment>
      );
    }
  )
);

BusterChartJSComponent.displayName = 'BusterChartJSComponent';
