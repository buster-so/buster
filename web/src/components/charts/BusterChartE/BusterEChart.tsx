'use client';

import React, { useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { BusterEChartComponent } from './BusterEChartComponent';
import type { EChartsInstance } from 'echarts-for-react/lib/types';
import { DEFAULT_CHART_CONFIG, DEFAULT_COLUMN_METADATA } from '@/api/buster_rest/threads/defaults';
import { BusterEChartLegendWrapper } from './BusterEChartLegendWrapper';
import { BusterChartComponentProps } from '../interfaces/chartComponentInterfaces';

export const BusterEChart: React.FC<BusterChartComponentProps> = React.memo(
  ({
    selectedChartType,
    loading = false,
    className = '',
    animate = true,
    colors = DEFAULT_CHART_CONFIG.colors,
    showLegend,
    columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
    selectedAxis,
    showLegendHeadline,
    columnMetadata = DEFAULT_COLUMN_METADATA,
    useRapidResizeObserver = false,
    onChartMounted,
    onInitialAnimationEnd,
    columnSettings = DEFAULT_CHART_CONFIG.columnSettings,
    lineGroupType = DEFAULT_CHART_CONFIG.lineGroupType,
    barGroupType = DEFAULT_CHART_CONFIG.barGroupType,
    ...props
  }) => {
    const chartRef = useRef<EChartsInstance>(null);
    const [chartMounted, setChartMounted] = useState(false);

    const onChartReady = useMemoizedFn(() => {
      setChartMounted(true);
      onChartMounted?.();
    });

    const onInitialAnimationEndPreflight = useMemoizedFn(() => {
      onInitialAnimationEnd?.();
    });

    return (
      <BusterEChartLegendWrapper
        className={className}
        loading={loading}
        animate={animate}
        chartMounted={chartMounted}
        chartRef={chartRef}
        selectedChartType={selectedChartType}
        columnSettings={columnSettings}
        selectedAxis={selectedAxis}
        columnLabelFormats={columnLabelFormats}
        showLegend={showLegend}
        columnMetadata={columnMetadata}
        showLegendHeadline={showLegendHeadline}
        lineGroupType={lineGroupType}
        barGroupType={barGroupType}
        colors={colors}>
        <BusterEChartComponent
          ref={chartRef}
          selectedChartType={selectedChartType}
          onChartReady={onChartReady}
          onInitialAnimationEnd={onInitialAnimationEndPreflight}
          selectedAxis={selectedAxis!}
          columnLabelFormats={columnLabelFormats}
          colors={colors}
          columnMetadata={columnMetadata}
          animate={animate}
          columnSettings={columnSettings}
          lineGroupType={lineGroupType}
          barGroupType={barGroupType}
          {...props}
          className={className}
          useRapidResizeObserver={useRapidResizeObserver}
        />
      </BusterEChartLegendWrapper>
    );
  }
);
BusterEChart.displayName = 'BusterChart';
