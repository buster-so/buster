'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { ChartType, BarSortBy, BusterChartConfigProps } from '../interfaces';
import { ChartEncodes } from '../interfaces';
import {
  useSeriesOptions,
  useAxisAndTickOptions,
  useTooltipOptions,
  useEchartThemes
} from './hooks';
import { useColors } from '../chartHooks';
import { DEFAULT_CHART_THEME } from '../configColors';
import { DEFAULT_CHART_CONFIG } from '@/api/buster_rest/threads/defaults';
import type { ColumnMetaData } from '@/api/buster_rest';
import { useAxisTitles } from '../commonHelpers/useAxisTitles';
import { BusterEChartWrapper } from './BusterEChartWrapper';
//import ReactECharts, { type EChartsInstance } from 'echarts-for-react';
import type { EChartsInstance } from 'echarts-for-react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';

import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart
  // RadarChart,
  // MapChart,
  // TreeChart,
  // TreemapChart,
  // GraphChart,
  // GaugeChart,
  // FunnelChart,
  // ParallelChart,
  // SankeyChart,
  // BoxplotChart,
  // CandlestickChart,
  // EffectScatterChart,
  // LinesChart,
  // HeatmapChart,
  // PictorialBarChart,
  // ThemeRiverChart,
  // SunburstChart,
  // CustomChart,
} from 'echarts/charts';
import {
  // GridSimpleComponent,
  GridComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  SingleAxisComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  // ToolboxComponent,
  TooltipComponent,
  AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // TimelineComponent,
  // MarkPointComponent,
  // MarkLineComponent,
  // MarkAreaComponent,
  // LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  // DataZoomComponent,
  // DataZoomInsideComponent,
  // DataZoomSliderComponent,
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  // AriaComponent,
  TransformComponent,
  DatasetComponent
} from 'echarts/components';
import {
  CanvasRenderer
  // SVGRenderer,
} from 'echarts/renderers';
import { BusterChartTypeComponentProps } from '../interfaces/chartComponentInterfaces';

// Register the required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  LineChart,
  PieChart,
  ScatterChart,
  TransformComponent,
  DatasetComponent,
  SingleAxisComponent
]);

export const BusterEChartComponent = React.memo(
  React.forwardRef<EChartsInstance, BusterChartTypeComponentProps>(
    (
      {
        onChartReady,
        onInitialAnimationEnd,
        columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
        columnSettings = {},
        selectedChartType,
        selectedAxis,
        className,
        scatterDotSize,
        colors: colorsProp = DEFAULT_CHART_THEME,
        pieDonutWidth,
        pieShowInnerLabel,
        pieLabelPosition,
        pieInnerLabelTitle,
        pieInnerLabelAggregate,
        yAxisAxisTitle,
        yAxisScaleType,
        yAxisShowAxisLabel,
        yAxisStartAxisAtZero,
        xAxisAxisTitle,
        xAxisShowAxisLabel,
        xAxisLabelRotation,
        xAxisDataZoom,
        barShowTotalAtTop,
        barGroupType,
        lineGroupType,
        pieDisplayLabelAs,
        barLayout,
        columnMetadata,
        yAxisShowAxisTitle,
        xAxisShowAxisTitle,
        useRapidResizeObserver = false,
        animate = true,
        gridLines,
        goalLines,
        y2AxisShowAxisTitle,
        y2AxisAxisTitle,
        y2AxisShowAxisLabel,
        y2AxisScaleType,
        y2AxisStartAxisAtZero,
        tooltipKeys,
        yAxisKeys,
        y2AxisKeys,
        datasetOptions,
        dataTrendlineOptions
      },
      echartsRef
    ) => {
      const initialAnimationComplete = useRef(false);

      const theme = useEchartThemes();

      const { yAxisTitle, xAxisTitle, y2AxisTitle } = useAxisTitles({
        selectedAxis,
        columnLabelFormats,
        xAxisShowAxisTitle,
        yAxisShowAxisTitle,
        xAxisAxisTitle,
        yAxisAxisTitle,
        y2AxisShowAxisTitle,
        y2AxisAxisTitle,
        selectedChartType,
        barLayout
      });

      const axisAndTickOptions = useAxisAndTickOptions({
        selectedChartType,
        selectedAxis,
        columnLabelFormats,
        yAxisScaleType,
        yAxisShowAxisLabel,
        yAxisStartAxisAtZero,
        xAxisShowAxisLabel,
        xAxisLabelRotation,
        xAxisDataZoom,
        barLayout,
        columnMetadata,
        barGroupType,
        lineGroupType,
        gridLines,
        columnSettings,
        barShowTotalAtTop,
        y2AxisScaleType,
        y2AxisStartAxisAtZero,
        y2AxisShowAxisLabel
      });

      const tooltipOptions = useTooltipOptions({
        tooltipKeys,
        columnLabelFormats,
        selectedChartType,
        barGroupType,
        lineGroupType,
        pieDisplayLabelAs,
        columnSettings,
        selectedAxis
      });

      const colors = useColors({ colors: colorsProp, yAxisKeys, y2AxisKeys, datasetOptions });

      const seriesOptions = useSeriesOptions({
        selectedChartType,
        datasets: datasetOptions,
        yAxisKeys,
        y2AxisKeys,
        columnLabelFormats,
        scatterDotSize,
        columnSettings,
        pieDonutWidth: pieDonutWidth ?? DEFAULT_CHART_CONFIG.pieDonutWidth,
        pieShowInnerLabel: pieShowInnerLabel ?? DEFAULT_CHART_CONFIG.pieShowInnerLabel,
        pieLabelPosition: pieLabelPosition ?? DEFAULT_CHART_CONFIG.pieLabelPosition,
        pieInnerLabelTitle: pieInnerLabelTitle ?? DEFAULT_CHART_CONFIG.pieInnerLabelTitle,
        pieInnerLabelAggregate:
          pieInnerLabelAggregate ?? DEFAULT_CHART_CONFIG.pieInnerLabelAggregate,
        barShowTotalAtTop: barShowTotalAtTop ?? DEFAULT_CHART_CONFIG.barShowTotalAtTop,
        barGroupType: barGroupType || DEFAULT_CHART_CONFIG.barGroupType!,
        lineGroupType: lineGroupType ?? DEFAULT_CHART_CONFIG.lineGroupType,
        colors,
        pieDisplayLabelAs,
        selectedAxis,
        barLayout,
        goalLines,
        dataTrendlineOptions
      });

      const option = useMemo(() => {
        /** @type EChartsOption */
        return {
          animationThreshold: 400,
          animation: animate,
          legend: { show: false },
          dataset: datasetOptions,
          series: seriesOptions,
          tooltip: tooltipOptions,
          color: colors,
          ...axisAndTickOptions
        };
      }, [
        datasetOptions,
        dataTrendlineOptions,
        animate,
        seriesOptions,
        tooltipOptions,
        axisAndTickOptions,
        colors
      ]);

      const memoizedEvents = useMemo(() => {
        return {
          finished: () => {
            if (!initialAnimationComplete.current) {
              onInitialAnimationEnd?.();
            }
            initialAnimationComplete.current = true;
          }
        };
      }, []);

      useEffect(() => {
        if (!useRapidResizeObserver) return;

        // Function to set up the resize observer
        const setupResizeObserver = () => {
          const echartRef = echartsRef as unknown as React.RefObject<EChartsInstance>;
          const chart = echartRef?.current && echartRef.current.getEchartsInstance();

          if (!chart) return;

          const resizeObserver = new ResizeObserver(() => {
            initialAnimationComplete.current && chart && chart.resize();
          });

          resizeObserver.observe(echartRef.current.ele);
          return resizeObserver;
        };

        // Initial attempt to set up observer
        let resizeObserver = setupResizeObserver();

        // If ref isn't ready yet, poll until it is
        if (!resizeObserver) {
          const interval = setInterval(() => {
            resizeObserver = setupResizeObserver();
            if (resizeObserver) {
              clearInterval(interval);
            }
          }, 100); // Check every 100ms

          // Cleanup interval if component unmounts
          return () => {
            clearInterval(interval);
            resizeObserver?.disconnect();
          };
        }

        // Cleanup observer if initial setup succeeded
        return () => {
          resizeObserver?.disconnect();
        };
      }, [useRapidResizeObserver]);

      return (
        <BusterEChartWrapper
          xAxisTitle={xAxisTitle}
          yAxisTitle={yAxisTitle}
          y2AxisTitle={y2AxisTitle}>
          {/* <ReactECharts
            ref={echartsRef}
            option={option}
            onChartReady={onChartReady}
            onEvents={memoizedEvents}
            className={`${className} !h-full !w-full`}
            lazyUpdate={true}
            notMerge={true} //needs to be true if the y axis keys change
            theme={theme}
            opts={{ renderer: 'canvas' }}
          /> */}

          <ReactEChartsCore
            ref={echartsRef}
            echarts={echarts}
            option={option}
            className={`${className} !h-full !w-full`}
            notMerge={true}
            lazyUpdate={true}
            theme={theme}
            onChartReady={onChartReady}
            onEvents={memoizedEvents}
            opts={{ renderer: 'canvas' }}
          />
        </BusterEChartWrapper>
      );
    }
  )
);
